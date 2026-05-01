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

const DAILY_POINTS = 10;
const DUPLICATE_POINTS = 1;

// Same order as src/data/butterflies.ts BASE_SPECIES array
const SPECIES_IDS: string[] = [
  "aglais-urticae", "aglais-io", "vanessa-atalanta", "vanessa-cardui",
  "polygonia-c-album", "nymphalis-polychloros", "nymphalis-antiopa", "nymphalis-c-album",
  "araschnia-levana", "argynnis-paphia", "argynnis-aglaja", "argynnis-adippe",
  "argynnis-niobe", "brenthis-ino", "boloria-selene", "boloria-euphrosyne",
  "boloria-aquilonaris", "boloria-frigga", "boloria-freija", "boloria-improba",
  "euphydryas-iduna", "melitaea-cinxia", "melitaea-athalia", "melitaea-diamina",
  "limenitis-populi", "apatura-iris", "lasiommata-megera", "lasiommata-maera",
  "pararge-aegeria", "coenonympha-pamphilus", "coenonympha-tullia", "aphantopus-hyperantus",
  "maniola-jurtina", "erebia-ligea", "erebia-pandrose", "erebia-embla",
  "erebia-disa", "oeneis-jutta", "oeneis-bore", "oeneis-norna",
  "lycaena-phlaeas", "lycaena-hippothoe", "lycaena-virgaureae", "thecla-betulae",
  "callophrys-rubi", "favonius-quercus", "cupido-minimus", "everes-argiades",
  "celastrina-argiolus", "plebejus-argus", "plebejus-idas", "aricia-artaxerxes",
  "polyommatus-icarus", "agriades-aquilo", "agriades-glandon", "pieris-brassicae",
  "pieris-rapae", "pieris-napi", "pieris-dulcinea", "pontia-edusa",
  "anthocharis-cardamines", "colias-palaeno", "colias-hecla", "colias-nastes",
  "colias-hyale", "gonepteryx-rhamni", "leptidea-sinapis", "leptidea-juvernica",
  "papilio-machaon", "iphiclides-podalirius", "parnassius-apollo", "parnassius-mnemosyne",
  "ochlodes-sylvanus", "thymelicus-sylvestris", "thymelicus-lineola", "hesperia-comma",
  "carterocephalus-palaemon", "erynnis-tages", "pyrgus-malvae", "pyrgus-centaureae",
];

function getTodayString(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDailySpeciesId(): string {
  const dateStr = getTodayString();
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  return SPECIES_IDS[hash % SPECIES_IDS.length];
}

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
    is_daily?: boolean;
    isDaily?: boolean;
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
  const suspicionFlags: string[] = [];

  // Anti-cheat: check same location catches
  const hasExif = body.has_exif ?? body.hasExif ?? false;
  if (!hasExif) {
    suspicionFlags.push("missing_exif");
  }

  // ── Daily catch path ────────────────────────────────────────────────────────
  const isDaily = body.is_daily ?? body.isDaily ?? false;

  if (isDaily) {
    const dailySpeciesId = getDailySpeciesId();
    if (speciesId !== dailySpeciesId) {
      return new Response(JSON.stringify({ error: "Denne arten er ikke dagens sommerfugl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user has already claimed the daily catch today (UTC date)
    const todayStart = `${getTodayString()}T00:00:00.000Z`;
    const { count: dailyClaimedCount, error: dailyErr } = await supabase
      .from("catches")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user_id)
      .eq("is_daily", true)
      .gte("found_at", todayStart);

    if (dailyErr) {
      return new Response(JSON.stringify({ error: `Database error: ${dailyErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((dailyClaimedCount ?? 0) > 0) {
      return new Response(JSON.stringify({ error: "Du har allerede krevd dagens sommerfugl i dag" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insertErr } = await supabase.from("catches").insert({
      user_id: session.user_id,
      species_id: speciesId,
      rarity,
      vision_score: visionScore,
      points_awarded: DAILY_POINTS,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      has_exif: hasExif,
      device_make: body.device_make ?? body.deviceMake ?? null,
      device_model: body.device_model ?? body.deviceModel ?? null,
      counted_in_leaderboard: true,
      suspicion_flags: suspicionFlags,
      is_daily: true,
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
        pointsAwarded: DAILY_POINTS,
        countedInLeaderboard: true,
        suspicionFlags,
        isDaily: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ── Regular catch path ──────────────────────────────────────────────────────
  const rarityPoints = Math.round(10 * (RARITY_MULTIPLIER[rarity] ?? 1));
  let countedInLeaderboard = true;

  const { count: existingSpeciesCount, error: existingSpeciesErr } = await supabase
    .from("catches")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.user_id)
    .eq("species_id", speciesId)
    .eq("is_daily", false);

  if (existingSpeciesErr) {
    return new Response(JSON.stringify({ error: `Database error: ${existingSpeciesErr.message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const isDuplicate = (existingSpeciesCount ?? 0) > 0;
  if (isDuplicate) {
    suspicionFlags.push("duplicate_catch");
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

  // Duplicate catches award 1 point (unless location is flagged)
  const pointsAwarded = isDuplicate ? DUPLICATE_POINTS : rarityPoints;

  // Save catch
  const { error: insertErr } = await supabase.from("catches").insert({
    user_id: session.user_id,
    species_id: speciesId,
    rarity,
    vision_score: visionScore,
    points_awarded: pointsAwarded,
    lat: body.lat ?? null,
    lng: body.lng ?? null,
    has_exif: hasExif,
    device_make: body.device_make ?? body.deviceMake ?? null,
    device_model: body.device_model ?? body.deviceModel ?? null,
    counted_in_leaderboard: countedInLeaderboard,
    suspicion_flags: suspicionFlags,
    is_daily: false,
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
      pointsAwarded,
      countedInLeaderboard,
      suspicionFlags,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
