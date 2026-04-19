import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,32}$/;
const LOGIN_IP_WINDOW_MINUTES = 15;
const LOGIN_IP_MAX_FAILURES = 10;
const LOGIN_USERNAME_WINDOW_MINUTES = 15;
const LOGIN_USERNAME_MAX_FAILURES = 5;

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
    const body = await req.json() as { username?: string; password?: string };
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";
    const clientIp = getClientIp(req);

    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Mangler brukernavn eller passord" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!USERNAME_REGEX.test(username)) {
      return new Response(JSON.stringify({ error: "Ugyldig brukernavn eller passord" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [ipFailures, usernameFailures] = await Promise.all([
      countRecentAttempts(supabase, "login_ip_failure", clientIp, LOGIN_IP_WINDOW_MINUTES),
      countRecentAttempts(supabase, "login_username_failure", username.toLowerCase(), LOGIN_USERNAME_WINDOW_MINUTES),
    ]);

    if (ipFailures >= LOGIN_IP_MAX_FAILURES || usernameFailures >= LOGIN_USERNAME_MAX_FAILURES) {
      return new Response(JSON.stringify({ error: "For mange innloggingsforsok. Proev igjen senere." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: user, error: selectErr } = await supabase
      .from("users")
      .select("id, username, password_hash")
      .eq("username", username)
      .maybeSingle();

    if (selectErr) {
      return new Response(JSON.stringify({ error: `Databasefeil: ${selectErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!user) {
      await Promise.all([
        recordAttempt(supabase, "login_ip_failure", clientIp),
        recordAttempt(supabase, "login_username_failure", username.toLowerCase()),
      ]);
      return new Response(JSON.stringify({ error: "Ugyldig brukernavn eller passord" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      await Promise.all([
        recordAttempt(supabase, "login_ip_failure", clientIp),
        recordAttempt(supabase, "login_username_failure", username.toLowerCase()),
      ]);
      return new Response(JSON.stringify({ error: "Ugyldig brukernavn eller passord" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

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
    return new Response(JSON.stringify({ error: `Innlogging feilet: ${message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
