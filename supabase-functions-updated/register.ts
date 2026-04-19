import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,32}$/;
const MIN_PASSWORD_LENGTH = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const body = await req.json() as { username?: string; password?: string };
  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!username || !password) {
    return new Response(JSON.stringify({ error: "Mangler brukernavn eller passord" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!USERNAME_REGEX.test(username)) {
    return new Response(JSON.stringify({ error: "Ugyldig brukernavnformat" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return new Response(JSON.stringify({ error: `Passord ma vaere minst ${MIN_PASSWORD_LENGTH} tegn` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: existingUser, error: existingUserErr } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingUserErr) {
    return new Response(JSON.stringify({ error: `Databasefeil: ${existingUserErr.message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (existingUser) {
    return new Response(JSON.stringify({ error: "Brukernavn er allerede i bruk" }), {
      status: 409,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const passwordHash = bcrypt.hashSync(password, 12);

  const { data: user, error: insertErr } = await supabase
    .from("users")
    .insert({
      username,
      password_hash: passwordHash,
      password_updated_at: new Date().toISOString(),
    })
    .select("id, username")
    .single();

  if (insertErr) {
    return new Response(JSON.stringify({ error: `Opprett bruker feilet: ${insertErr.message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const { error: sessionErr } = await supabase
    .from("sessions")
    .insert({
      token: sessionToken,
      user_id: user.id,
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
      userId: user.id,
      username: user.username,
      sessionToken,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
