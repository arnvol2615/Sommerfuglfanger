import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACHIEVEMENT_POINTS: Record<string, number> = {
  first_catch: 5,
  rare_catch: 15,
  legendary_catch: 30,
  redlist_hunter: 25,
  all_rarities: 20,
  one_per_family: 25,
  daily_dedicated: 20,
};

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

    const body = await req.json() as { achievement_id?: string };
    const achievementId = body.achievement_id?.trim() ?? "";

    if (!achievementId || !(achievementId in ACHIEVEMENT_POINTS)) {
      return new Response(JSON.stringify({ error: "Ugyldig achievement_id" }), {
        status: 400,
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

    const points = ACHIEVEMENT_POINTS[achievementId];

    // ON CONFLICT DO NOTHING — safe to call multiple times
    const { error } = await supabase.from("user_achievements").upsert(
      { user_id: session.user_id, achievement_id: achievementId, points_awarded: points },
      { onConflict: "user_id,achievement_id", ignoreDuplicates: true }
    );

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, points_awarded: points }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
