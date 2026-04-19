import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const body = await req.json() as { username: string };
  if (!body.username) {
    return new Response(JSON.stringify({ error: "Mangler brukernavn" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find or create user
  const { data: user, error: selectErr } = await supabase
    .from("users")
    .select("id, username")
    .eq("username", body.username)
    .maybeSingle();

  let finalUser = user;

  if (!finalUser && !selectErr) {
    const { data: newUser, error: insertErr } = await supabase
      .from("users")
      .insert({ username: body.username })
      .select()
      .single();
    
    if (insertErr) {
      return new Response(JSON.stringify({ error: `Opprett bruker feilet: ${insertErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    finalUser = newUser;
  }

  if (!finalUser) {
    return new Response(JSON.stringify({ error: "Bruker ikke funnet" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create session
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const { error: sessionErr } = await supabase
    .from("sessions")
    .insert({
      token: sessionToken,
      user_id: finalUser.id,
      expires_at: expiresAt.toISOString(),
    });

  if (sessionErr) {
    return new Response(JSON.stringify({ error: `Sesjon feilet: ${sessionErr.message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      userId: finalUser.id,
      username: finalUser.username,
      sessionToken,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
