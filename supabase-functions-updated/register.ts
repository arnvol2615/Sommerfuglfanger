import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,32}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const REGISTER_IP_WINDOW_MINUTES = 60;
const REGISTER_IP_MAX_ATTEMPTS = 10;
const REGISTER_USERNAME_WINDOW_MINUTES = 60;
const REGISTER_USERNAME_MAX_ATTEMPTS = 3;

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  return forwardedFor || realIp || cfIp || "unknown";
}

async function countRecentAttempts(
  supabase: ReturnType<typeof createClient>,
  action: string,
  bucketKey: string,
  windowMinutes: number,
): Promise<number> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("auth_rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("action", action)
    .eq("bucket_key", bucketKey)
    .gte("created_at", windowStart);

  if (error) {
    throw new Error(`Rate limit lookup feilet: ${error.message}`);
  }

  return count ?? 0;
}

async function recordAttempt(
  supabase: ReturnType<typeof createClient>,
  action: string,
  bucketKey: string,
): Promise<void> {
  const { error } = await supabase.from("auth_rate_limits").insert({
    action,
    bucket_key: bucketKey,
  });

  if (error) {
    throw new Error(`Rate limit insert feilet: ${error.message}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json() as { username?: string; password?: string; email?: string };
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const normalizedUsername = username.toLowerCase();
    const clientIp = getClientIp(req);

    if (!username || !password || !email) {
      return new Response(JSON.stringify({ error: "Mangler brukernavn, e-post eller passord" }), {
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

    if (!EMAIL_REGEX.test(email)) {
      return new Response(JSON.stringify({ error: "Ugyldig e-postadresse" }), {
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

    const [ipAttempts, usernameAttempts] = await Promise.all([
      countRecentAttempts(supabase, "register_ip_attempt", clientIp, REGISTER_IP_WINDOW_MINUTES),
      countRecentAttempts(supabase, "register_username_attempt", normalizedUsername, REGISTER_USERNAME_WINDOW_MINUTES),
    ]);

    if (ipAttempts >= REGISTER_IP_MAX_ATTEMPTS || usernameAttempts >= REGISTER_USERNAME_MAX_ATTEMPTS) {
      return new Response(JSON.stringify({ error: "For mange registreringsforsok. Proev igjen senere." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await Promise.all([
      recordAttempt(supabase, "register_ip_attempt", clientIp),
      recordAttempt(supabase, "register_username_attempt", normalizedUsername),
    ]);

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

    const { data: existingEmail, error: existingEmailErr } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingEmailErr) {
      return new Response(JSON.stringify({ error: `Databasefeil: ${existingEmailErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existingEmail) {
      return new Response(JSON.stringify({ error: "E-post er allerede i bruk" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const passwordHash = bcrypt.hashSync(password, 12);

    const { data: user, error: insertErr } = await supabase
      .from("users")
      .insert({
        username,
        email,
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: `Registrering feilet: ${message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
