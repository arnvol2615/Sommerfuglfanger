import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import bcrypt from "https://esm.sh/bcryptjs@2.4.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MIN_PASSWORD_LENGTH = 8;
const RESET_IP_WINDOW_MINUTES = 30;
const RESET_IP_MAX_ATTEMPTS = 5;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,32}$/;
const RESET_REQUEST_IP_WINDOW_MINUTES = 60;
const RESET_REQUEST_IP_MAX_ATTEMPTS = 5;
const RESET_REQUEST_IDENTITY_WINDOW_MINUTES = 60;
const RESET_REQUEST_IDENTITY_MAX_ATTEMPTS = 3;
const RESET_TOKEN_TTL_MINUTES = 15;

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  return forwardedFor || realIp || cfIp || "unknown";
}

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
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

async function sendResetEmail(params: {
  resendApiKey: string;
  from: string;
  to: string;
  resetLink: string;
}): Promise<void> {
  const resend = new Resend(params.resendApiKey);
  const { error } = await resend.emails.send({
    from: params.from,
    to: [params.to],
    subject: "Tilbakestill passordet ditt",
    html: `<p>Vi mottok en foresporsel om nytt passord.</p><p><a href="${params.resetLink}">Klikk her for aa sette nytt passord</a></p><p>Lenken utloper om ${RESET_TOKEN_TTL_MINUTES} minutter.</p><p>Hvis du ikke ba om dette, kan du ignorere e-posten.</p>`,
    text: `Vi mottok en foresporsel om nytt passord. Aapne denne lenken for aa sette nytt passord: ${params.resetLink}. Lenken utloper om ${RESET_TOKEN_TTL_MINUTES} minutter.`,
  });

  if (error) {
    throw new Error(`Resend-feil: ${error.message}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json() as {
      token?: string;
      newPassword?: string;
      email?: string;
      username?: string;
    };
    const token = body.token?.trim() ?? "";
    const newPassword = body.newPassword ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const username = body.username?.trim() ?? "";
    const clientIp = getClientIp(req);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Request reset email mode: { email? | username? }
    if (!token && !newPassword) {
      const identity = email || username.toLowerCase();

      if (!email && !username) {
        return new Response(JSON.stringify({ error: "Mangler e-post eller brukernavn" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (email && !EMAIL_REGEX.test(email)) {
        return new Response(JSON.stringify({ error: "Ugyldig e-postadresse" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (username && !USERNAME_REGEX.test(username)) {
        return new Response(JSON.stringify({ error: "Ugyldig brukernavnformat" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const [ipAttempts, identityAttempts] = await Promise.all([
        countRecentAttempts(supabase, "request_reset_ip_attempt", clientIp, RESET_REQUEST_IP_WINDOW_MINUTES),
        countRecentAttempts(supabase, "request_reset_identity_attempt", identity, RESET_REQUEST_IDENTITY_WINDOW_MINUTES),
      ]);

      if (ipAttempts >= RESET_REQUEST_IP_MAX_ATTEMPTS || identityAttempts >= RESET_REQUEST_IDENTITY_MAX_ATTEMPTS) {
        return new Response(JSON.stringify({ error: "For mange foresporsler. Proev igjen senere." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await Promise.all([
        recordAttempt(supabase, "request_reset_ip_attempt", clientIp),
        recordAttempt(supabase, "request_reset_identity_attempt", identity),
      ]);

      const query = supabase.from("users").select("id, email");
      const { data: user, error: userErr } = email
        ? await query.eq("email", email).maybeSingle()
        : await query.eq("username", username).maybeSingle();

      if (userErr) {
        throw new Error(`Databasefeil: ${userErr.message}`);
      }

      if (user?.email) {
        const tokenValue = `${crypto.randomUUID()}${crypto.randomUUID().replace(/-/g, "")}`;
        const tokenHash = await hashToken(tokenValue);
        const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

        const { error: tokenErr } = await supabase.from("password_reset_tokens").insert({
          user_id: user.id,
          token_hash: tokenHash,
          requested_ip: clientIp,
          expires_at: expiresAt,
        });

        if (tokenErr) {
          throw new Error(`Kunne ikke lagre reset-token: ${tokenErr.message}`);
        }

        const appBaseUrl = Deno.env.get("APP_BASE_URL");
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        const emailFrom = Deno.env.get("EMAIL_FROM");

        if (!appBaseUrl || !resendApiKey || !emailFrom) {
          throw new Error("Mangler APP_BASE_URL, RESEND_API_KEY eller EMAIL_FROM");
        }

        const resetLink = `${appBaseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(tokenValue)}`;
        await sendResetEmail({
          resendApiKey,
          from: emailFrom,
          to: user.email,
          resetLink,
        });
      }

      return new Response(
        JSON.stringify({ message: "Hvis kontoen finnes, har vi sendt deg en e-post." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Complete reset mode: { token, newPassword }
    if (!token || !newPassword) {
      return new Response(JSON.stringify({ error: "Mangler token eller nytt passord" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return new Response(JSON.stringify({ error: `Passord ma vaere minst ${MIN_PASSWORD_LENGTH} tegn` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ipAttempts = await countRecentAttempts(
      supabase,
      "reset_password_ip_attempt",
      clientIp,
      RESET_IP_WINDOW_MINUTES,
    );

    if (ipAttempts >= RESET_IP_MAX_ATTEMPTS) {
      return new Response(JSON.stringify({ error: "For mange reset-forsok. Proev igjen senere." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await recordAttempt(supabase, "reset_password_ip_attempt", clientIp);

    const tokenHash = await hashToken(token);

    const { data: resetToken, error: tokenErr } = await supabase
      .from("password_reset_tokens")
      .select("id, user_id, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (tokenErr) {
      throw new Error(`Databasefeil: ${tokenErr.message}`);
    }

    if (!resetToken || resetToken.used_at || new Date(resetToken.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "Ugyldig eller utlopet reset-token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 12);

    const { error: updateUserErr } = await supabase
      .from("users")
      .update({
        password_hash: passwordHash,
        password_updated_at: new Date().toISOString(),
      })
      .eq("id", resetToken.user_id);

    if (updateUserErr) {
      throw new Error(`Kunne ikke oppdatere passord: ${updateUserErr.message}`);
    }

    const { error: useTokenErr } = await supabase
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", resetToken.id)
      .is("used_at", null);

    if (useTokenErr) {
      throw new Error(`Kunne ikke markere token som brukt: ${useTokenErr.message}`);
    }

    const { error: clearSessionsErr } = await supabase
      .from("sessions")
      .delete()
      .eq("user_id", resetToken.user_id);

    if (clearSessionsErr) {
      throw new Error(`Kunne ikke invalidere sesjoner: ${clearSessionsErr.message}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: `Passordreset feilet: ${message}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
