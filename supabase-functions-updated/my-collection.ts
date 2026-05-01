import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_POINTS = 10;
const DUPLICATE_POINTS = 1;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const sessionToken = authHeader.replace("Bearer ", "").trim();

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: "Mangler authorization-token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: session } = await supabase
      .from("sessions")
      .select("user_id")
      .eq("token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!session) {
      return new Response(JSON.stringify({ error: "Ugyldig eller utløpt sesjon" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: catches, error }, { data: achievementRows }] = await Promise.all([
      supabase
        .from("catches")
        .select("species_id, points_awarded, is_daily, counted_in_leaderboard")
        .eq("user_id", session.user_id),
      supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at, points_awarded")
        .eq("user_id", session.user_id),
    ]);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const speciesCounts = new Map<string, number>();
    let leaderboardScore = 0;
    let dailyCatchCount = 0;
    let validCatchCount = 0;
    const countedSpecies = new Set<string>();

    for (const row of (catches ?? []) as Array<{ species_id: string; points_awarded: number; is_daily: boolean; counted_in_leaderboard: boolean }>) {
      speciesCounts.set(row.species_id, (speciesCounts.get(row.species_id) ?? 0) + 1);

      if (!row.counted_in_leaderboard) continue;

      if (row.is_daily) {
        leaderboardScore += DAILY_POINTS;
        dailyCatchCount += 1;
        continue;
      }

      if (!countedSpecies.has(row.species_id)) {
        // First valid catch for this species: full rarity points
        countedSpecies.add(row.species_id);
        leaderboardScore += row.points_awarded;
        validCatchCount += 1;
      } else if (row.points_awarded === DUPLICATE_POINTS) {
        // New-style duplicate catch: 1 consolation point
        leaderboardScore += DUPLICATE_POINTS;
      }
      // Old-style duplicates (counted=true but rarity points) from data anomalies are skipped
    }

    const achievements = (achievementRows ?? []).map(
      (r: { achievement_id: string; unlocked_at: string; points_awarded?: number }) => ({
        id: r.achievement_id,
        unlockedAt: r.unlocked_at,
        pointsAwarded: r.points_awarded ?? 0,
      })
    );

    const achievementScore = achievements.reduce((sum, a) => sum + a.pointsAwarded, 0);

    return new Response(
      JSON.stringify({
        leaderboard_score: leaderboardScore + achievementScore,
        valid_catch_count: validCatchCount,
        daily_catch_count: dailyCatchCount,
        unique_species_count: speciesCounts.size,
        total_catch_count: catches?.length ?? 0,
        found_species_ids: Array.from(speciesCounts.keys()).sort((a, b) => a.localeCompare(b)),
        achievements,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});