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
    rarity: string;
    vision_score: number;
    lat?: number;
    lng?: number;
    has_exif?: boolean;
    device_make?: string;
    device_model?: string;
  };

  if (!body.species_id || !body.rarity) {
    return new Response(JSON.stringify({ error: "Mangler species_id eller rarity" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const visionScore = body.vision_score ?? 0;
  const points = Math.round(10 * (RARITY_MULTIPLIER[body.rarity] ?? 1));
  const suspicionFlags: string[] = [];

  // Anti-cheat: check same location catches
  if (!body.has_exif) {
    suspicionFlags.push("missing_exif");
  }

  let countedInLeaderboard = true;

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
    species_id: body.species_id,
    rarity: body.rarity,
    vision_score: visionScore,
    points_awarded: points,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    has_exif: body.has_exif ?? false,
    device_make: body.device_make ?? null,
    device_model: body.device_model ?? null,
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
