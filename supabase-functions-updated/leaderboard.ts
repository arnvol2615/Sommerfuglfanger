import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const limitParam = parseInt(url.searchParams.get("limit") ?? "20");
    const limit = isNaN(limitParam) ? 20 : Math.min(limitParam, 100);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Query catches joined with users — include EXIF, device, and location data for authenticity scoring
    const { data: rawData, error } = await supabase
      .from("catches")
      .select("points_awarded, users!inner(username, id), has_exif, device_make, lat, lng")
      .eq("counted_in_leaderboard", true);

    if (error) {
      console.error("leaderboard query error:", JSON.stringify(error));
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Aggregate per user and collect metadata for authenticity scoring
    interface UserData {
      score: number;
      valid_catch_count: number;
      user_id: string;
      catches: Array<{ has_exif: boolean; device_make: string | null; lat: number | null; lng: number | null }>;
    }
    const scoreMap = new Map<string, UserData>();
    for (const row of (rawData ?? []) as Array<{ users: { username: string; id: string }; points_awarded: number; has_exif: boolean; device_make: string | null; lat: number | null; lng: number | null }>) {
      const name = row.users.username;
      const userId = row.users.id;
      const prev = scoreMap.get(name) ?? { score: 0, valid_catch_count: 0, user_id: userId, catches: [] };
      prev.catches.push({ has_exif: row.has_exif, device_make: row.device_make, lat: row.lat, lng: row.lng });
      scoreMap.set(name, { score: prev.score + row.points_awarded, valid_catch_count: prev.valid_catch_count + 1, user_id: userId, catches: prev.catches });
    }

    // Compute authenticity score for each user
    const computeAuthenticityScore = (catches: Array<{ has_exif: boolean; device_make: string | null; lat: number | null; lng: number | null }>) => {
      if (catches.length === 0) return { authenticity_score: 0.5, has_suspicious_activity: false };

      // EXIF percentage
      const exifCount = catches.filter(c => c.has_exif).length;
      const exifPercentage = exifCount / catches.length;

      // Location diversity (unique GPS points within 0.0001 degree ~ 10m)
      const uniqueLocations = new Set(
        catches
          .filter(c => c.lat !== null && c.lng !== null)
          .map(c => `${Math.round(c.lat! * 10000)},${Math.round(c.lng! * 10000)}`)
      );
      const locationDiversity = Math.min(uniqueLocations.size / catches.length, 1.0);

      // Device variety
      const uniqueDevices = new Set(catches.filter(c => c.device_make).map(c => c.device_make));
      const deviceConsistency = 1.0 - Math.min(uniqueDevices.size / catches.length, 1.0);

      // Calculate score: 40% EXIF, 35% location diversity, 25% device consistency
      const score = exifPercentage * 0.4 + locationDiversity * 0.35 + deviceConsistency * 0.25;

      // Flags: <20% EXIF or only 1 location (or no GPS data)
      const suspicious = exifPercentage < 0.2 || uniqueLocations.size <= 1;

      return { authenticity_score: score, has_suspicious_activity: suspicious };
    };

    const rows = Array.from(scoreMap.entries())
      .map(([username, s]) => {
        const auth = computeAuthenticityScore(s.catches);
        return {
          username,
          score: s.score,
          valid_catch_count: s.valid_catch_count,
          authenticity_score: auth.authenticity_score,
          has_suspicious_activity: auth.has_suspicious_activity,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return new Response(JSON.stringify({ rows }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("leaderboard uncaught error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
