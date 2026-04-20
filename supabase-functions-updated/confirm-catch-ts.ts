import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_CATCHES_PER_LOCATION = 3;
const LOCATION_RADIUS_DEG = 0.0002; // ~20 meters
const LOCATION_WINDOW_HOURS = 24;

const RARITY_MULTIPLIER: Record<string, number> = {
  "Svaert sjelden": 3,
  "Sjelden": 2,
  "Uvanlig": 1.5,
  "Vanlig": 1,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth
  const authHeader = req.headers.get("authorization") ?? "";
  const sessionToken = authHeader.replace("Bearer ", "").trim();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: session } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token", sessionToken)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!session) {
    return new Response(JSON.stringify({ error: "Ugyldig eller utløpt sesjon" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse request
  const body = await req.json() as {
    species_id: string;
    speciesId?: string;
    rarity: string;
    vision_score: number | string;
    visionScore?: number | string;
    lat?: number;
    lng?: number;
    has_exif?: boolean;
    hasExif?: boolean;
    device_make?: string;
    deviceMake?: string;
    device_model?: string;
    deviceModel?: string;
  };

  console.log('confirm-catch-ts received body:', JSON.stringify(body, null, 2));

  const speciesId = (body.species_id ?? body.speciesId ?? "").trim();
  const rarity = (body.rarity ?? "").trim();

  console.log('Parsed speciesId:', speciesId, 'rarity:', rarity);

  if (!speciesId) {
    console.error('Missing speciesId - body.species_id:', body.species_id, 'body.speciesId:', body.speciesId);
    return new Response(JSON.stringify({ error: "Mangler species_id" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!rarity) {
    console.error('Missing rarity - body.rarity:', body.rarity);
    return new Response(JSON.stringify({ error: "Mangler rarity" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawVisionScore = body.vision_score ?? body.visionScore ?? 0;
  const parsedVisionScore = Number(rawVisionScore);
  const normalizedVisionScore = Number.isFinite(parsedVisionScore) ? parsedVisionScore : 0;
  const visionScorePercent = normalizedVisionScore >= 0 && normalizedVisionScore <= 1
    ? normalizedVisionScore * 100
    : normalizedVisionScore;
  const visionScore = Math.round(visionScorePercent);
  const points = Math.round(10 * (RARITY_MULTIPLIER[rarity] ?? 1));
  const suspicionFlags: string[] = [];

  // Anti-cheat: check same location catches
  const hasExif = body.has_exif ?? body.hasExif ?? false;
  if (!hasExif) {
    suspicionFlags.push("missing_exif");
  }

  let countedInLeaderboard = true;

  const { count: existingSpeciesCount, error: existingSpeciesErr } = await supabase
    .from("catches")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.user_id)
    .eq("species_id", speciesId)
    .eq("counted_in_leaderboard", true);

  if (existingSpeciesErr) {
    return new Response(JSON.stringify({ error: `Database error: ${existingSpeciesErr.message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if ((existingSpeciesCount ?? 0) > 0) {
    countedInLeaderboard = false;
    suspicionFlags.push("duplicate_species");
  }

  if (body.lat !== undefined && body.lng !== undefined) {
    const lat = body.lat;
    const lng = body.lng;
    const windowStart = new Date(Date.now() - LOCATION_WINDOW_HOURS * 3600 * 1000).toISOString();
    
    const { count } = await supabase
      .from("catches")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user_id)
      .eq("counted_in_leaderboard", true)
      .gte("lat", lat - LOCATION_RADIUS_DEG)
      .lte("lat", lat + LOCATION_RADIUS_DEG)
      .gte("lng", lng - LOCATION_RADIUS_DEG)
      .lte("lng", lng + LOCATION_RADIUS_DEG)
      .gte("found_at", windowStart);

    if ((count ?? 0) >= MAX_CATCHES_PER_LOCATION) {
      countedInLeaderboard = false;
      suspicionFlags.push("repeated_location");
    }
  }

  // Save catch
  const { error: insertErr } = await supabase.from("catches").insert({
    user_id: session.user_id,
    species_id: speciesId,
    rarity,
    vision_score: visionScore,
    points_awarded: points,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    has_exif: hasExif,
    device_make: body.device_make ?? body.deviceMake ?? null,
    device_model: body.device_model ?? body.deviceModel ?? null,
    counted_in_leaderboard: countedInLeaderboard,
    suspicion_flags: suspicionFlags,
  });

  if (insertErr) {
    return new Response(JSON.stringify({ error: `Database error: ${insertErr.message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      pointsAwarded: points,
      countedInLeaderboard,
      suspicionFlags,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
