import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_PER_HOUR = 5;

type IssueCategory = "bug" | "feature" | "other";

function normalizeCategory(value: string | undefined): IssueCategory {
  if (value === "bug" || value === "feature" || value === "other") return value;
  return "other";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Kun POST er støttet" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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

    const { data: user } = await supabase
      .from("users")
      .select("username")
      .eq("id", session.user_id)
      .maybeSingle();

    const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount, error: rateError } = await supabase
      .from("auth_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("action", "github_issue_submit")
      .eq("bucket_key", session.user_id)
      .gte("created_at", windowStart);

    if (rateError) {
      return new Response(JSON.stringify({ error: `Rate limit-feil: ${rateError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((recentCount ?? 0) >= RATE_LIMIT_PER_HOUR) {
      return new Response(JSON.stringify({ error: "For mange innsendinger. Prøv igjen om litt." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as {
      title?: string;
      description?: string;
      category?: string;
      page?: string;
      appVersion?: string;
      honeypot?: string;
    };

    if ((body.honeypot ?? "").trim()) {
      return new Response(JSON.stringify({ error: "Ugyldig forespørsel" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const title = (body.title ?? "").trim();
    const description = (body.description ?? "").trim();
    const category = normalizeCategory(body.category);

    if (!title || title.length < 6 || title.length > 120) {
      return new Response(JSON.stringify({ error: "Tittel må være mellom 6 og 120 tegn" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!description || description.length < 10 || description.length > 4000) {
      return new Response(JSON.stringify({ error: "Beskrivelse må være mellom 10 og 4000 tegn" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const githubToken = Deno.env.get("GITHUB_TOKEN") ?? "";
    const githubRepo = Deno.env.get("GITHUB_REPO") ?? "";

    if (!githubToken || !githubRepo.includes("/")) {
      return new Response(JSON.stringify({ error: "GitHub-integrasjon er ikke konfigurert" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only include labels if explicitly configured via GITHUB_ISSUE_LABELS.
    // GitHub returns 422 if any label does not already exist in the repository.
    const configuredLabels = (Deno.env.get("GITHUB_ISSUE_LABELS") ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    const labels = configuredLabels.length > 0 ? configuredLabels : undefined;

    const issueBody = [
      "## Innsendt fra Sommerfuglfanger",
      "",
      `Kategori: ${category}`,
      `Bruker i appen: ${user?.username ?? "ukjent"}`,
      `Side/fane: ${(body.page ?? "ukjent").trim() || "ukjent"}`,
      `App-versjon: ${(body.appVersion ?? "ukjent").trim() || "ukjent"}`,
      `Tidspunkt (UTC): ${new Date().toISOString()}`,
      "",
      "## Beskrivelse",
      description,
    ].join("\n");

    const ghResponse = await fetch(`https://api.github.com/repos/${githubRepo}/issues`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${githubToken}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        body: issueBody,
        ...(labels ? { labels } : {}),
      }),
    });

    const ghData = await ghResponse.json() as { html_url?: string; number?: number; message?: string; errors?: unknown };
    if (!ghResponse.ok) {
      return new Response(JSON.stringify({
        error: "GitHub API-feil",
        github_status: ghResponse.status,
        github_message: ghData.message,
        github_errors: ghData.errors,
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("auth_rate_limits").insert({
      action: "github_issue_submit",
      bucket_key: session.user_id,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        issue_number: ghData.number,
        issue_url: ghData.html_url,
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
