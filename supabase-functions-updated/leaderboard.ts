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

    // Query catches joined with users directly — avoids schema cache issues with views
    const { data: rawData, error } = await supabase
      .from("catches")
      .select("points_awarded, users!inner(username)")
      .eq("counted_in_leaderboard", true);

    if (error) {
      console.error("leaderboard query error:", JSON.stringify(error));
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Aggregate per user
    const scoreMap = new Map<string, { score: number; valid_catch_count: number }>();
    for (const row of (rawData ?? []) as Array<{ users: { username: string }; points_awarded: number }>) {
      const name = row.users.username;
      const prev = scoreMap.get(name) ?? { score: 0, valid_catch_count: 0 };
      scoreMap.set(name, { score: prev.score + row.points_awarded, valid_catch_count: prev.valid_catch_count + 1 });
    }

    const rows = Array.from(scoreMap.entries())
      .map(([username, s]) => ({ username, score: s.score, valid_catch_count: s.valid_catch_count }))
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
