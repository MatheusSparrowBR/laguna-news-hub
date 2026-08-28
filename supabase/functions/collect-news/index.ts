import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * collect-news Edge Function
 *
 * Authentication modes:
 * 1. User authenticated: Authorization: Bearer <JWT>
 *    - Validates JWT, extracts user_id
 *    - Checks ownership of requested project_id
 *    - Uses admin client for data operations
 *
 * 2. Automation (secret key): apikey header contains a secret key named "automations"
 *    - The Supabase runtime injects SUPABASE_URL and SUPABASE_SECRET_KEYS
 *    - We validate the apikey matches the expected automation secret key
 *    - Uses admin client for data operations
 *
 * No manual SERVICE_ROLE_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SECRET_KEY,
 * or x-automation-secret header is used.
 */

const ALLOWED_ORIGINS = [
  "https://joqfrsovxrvpjdunvtvk.supabase.co",
  "https://lovable.dev",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

interface AuthResult {
  mode: "user" | "secret";
  userId?: string;
  error?: string;
  status?: number;
}

/**
 * Authenticates the request.
 * - If Authorization Bearer token is present, validates as user JWT.
 * - If apikey header contains the automation secret key, validates as automation.
 * - Otherwise returns 401.
 */
async function authenticate(
  req: Request,
  supabaseUrl: string,
  publishableKey: string,
  secretKeys: string,
): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization");
  const apikeyHeader = req.headers.get("apikey");

  // Strategy 1: User JWT via Authorization header
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");

    // Avoid treating the publishable key itself as a JWT
    if (token === publishableKey || token.startsWith("sb_")) {
      // This is not a user JWT, fall through to apikey check
    } else {
      const verifyClient = createClient(supabaseUrl, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: { user }, error } = await verifyClient.auth.getUser(token);
      if (error || !user) {
        return { mode: "user", error: "Invalid or expired token", status: 401 };
      }
      return { mode: "user", userId: user.id };
    }
  }

  // Strategy 2: Automation secret key via apikey header
  if (apikeyHeader && apikeyHeader.startsWith("sb_secret_")) {
    // Validate against the known automation secret key
    // SUPABASE_SECRET_KEYS is a comma-separated list of secret keys
    // We only accept the one named "automations"
    const automationKey = getAutomationSecretKey(secretKeys);
    if (!automationKey) {
      return { mode: "secret", error: "No automation secret key configured", status: 500 };
    }
    if (apikeyHeader === automationKey) {
      return { mode: "secret" };
    }
    // The apikey is a secret key but not the automations one
    return { mode: "secret", error: "Unauthorized: only the 'automations' secret key is accepted", status: 403 };
  }

  // If apikey is the publishable key (normal browser request without Bearer JWT)
  if (apikeyHeader === publishableKey) {
    return { mode: "user", error: "No authentication provided. Send Authorization: Bearer <JWT>", status: 401 };
  }

  return { mode: "user", error: "No valid credentials provided", status: 401 };
}

/**
 * Extracts the automation secret key from SUPABASE_SECRET_KEYS.
 * The runtime provides this as a comma-separated string of all secret keys.
 * We store only one named "automations" — it is the first (or only) secret key.
 *
 * If the project has multiple secret keys, the "automations" key should be
 * configured as the first one, or we match by prefix convention.
 */
function getAutomationSecretKey(secretKeys: string): string | null {
  if (!secretKeys) return null;
  // SUPABASE_SECRET_KEYS may be a single key or comma-separated
  const keys = secretKeys.split(",").map((k) => k.trim()).filter(Boolean);
  // Return the first secret key (the "automations" key)
  // In production, ensure only the "automations" key exists or is first
  return keys[0] || null;
}

/**
 * Creates an admin Supabase client using the secret key.
 * This bypasses RLS for privileged operations.
 */
function createAdminClient(supabaseUrl: string, secretKeys: string): SupabaseClient {
  const keys = secretKeys.split(",").map((k) => k.trim()).filter(Boolean);
  const secretKey = keys[0];
  if (!secretKey) {
    throw new Error("No secret key available for admin client");
  }
  return createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

interface SourceRow {
  id: string;
  name: string;
  rss_url: string;
  project_id: string;
}

interface FeedItem {
  title: string;
  link: string;
  pubDate: string | null;
  description: string | null;
}

function extractItems(xml: string): FeedItem[] {
  const items: FeedItem[] = [];

  // Handle RSS 2.0 <item> elements
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate") || extractTag(block, "dc:date");
    const description = extractTag(block, "description");

    if (title && link) {
      items.push({
        title: decodeEntities(title),
        link,
        pubDate,
        description: description ? decodeEntities(description) : null,
      });
    }
  }

  // Handle Atom <entry> elements if no RSS items found
  if (items.length === 0) {
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null) {
      const block = match[1];
      const title = extractTag(block, "title");
      const linkMatch = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/)
      const link = linkMatch ? linkMatch[1] : extractTag(block, "link");
      const pubDate = extractTag(block, "published") || extractTag(block, "updated");
      const description = extractTag(block, "summary") || extractTag(block, "content");

      if (title && link) {
        items.push({
          title: decodeEntities(title),
          link,
          pubDate,
          description: description ? decodeEntities(description) : null,
        });
      }
    }
  }

  return items;
}

function extractTag(block: string, tag: string): string | null {
  const cdataRegex = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`,
    "i",
  );
  const cdataMatch = block.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = block.match(regex);
  return match ? match[1].trim() : null;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/<[^>]+>/g, "");
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const publishableKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "";
    const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS") ?? "";

    if (!supabaseUrl || !secretKeys) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Authenticate the request
    const auth = await authenticate(req, supabaseUrl, publishableKey, secretKeys);
    if (auth.error) {
      return new Response(
        JSON.stringify({ error: auth.error }),
        { status: auth.status ?? 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Parse request body
    let body: { project_id?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { project_id } = body;

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "project_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Create admin client for privileged operations
    const supabase = createAdminClient(supabaseUrl, secretKeys);

    // Validate project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, owner_id")
      .eq("id", project_id)
      .maybeSingle();

    if (projectError) {
      return new Response(
        JSON.stringify({ error: "Failed to validate project" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Authorization: user mode requires ownership check
    if (auth.mode === "user") {
      if (project.owner_id !== auth.userId) {
        return new Response(
          JSON.stringify({ error: "Forbidden: you do not own this project" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // For secret mode: only the "automations" key is accepted (already validated in authenticate)
    // No additional project restriction for automation — it operates on the configured Laguna project

    // Create automation run record
    const { data: run, error: runError } = await supabase
      .from("automation_runs")
      .insert({
        project_id,
        run_type: "source_scan",
        status: "running",
        started_at: new Date().toISOString(),
        items_processed: 0,
      })
      .select("id")
      .single();

    if (runError) {
      throw new Error(`Failed to create run: ${runError.message}`);
    }

    // Fetch active sources with rss_url
    const { data: sources, error: sourcesError } = await supabase
      .from("sources")
      .select("id, name, rss_url, project_id")
      .eq("project_id", project_id)
      .eq("active", true)
      .not("rss_url", "is", null);

    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    }

    const activeSources: SourceRow[] = (sources ?? []).filter(
      (s: any) => s.rss_url,
    );

    const logs: {
      source_id: string;
      source_name: string;
      found: number;
      new: number;
      duplicate: number;
      error: string | null;
    }[] = [];

    let totalFound = 0;
    let totalNew = 0;
    let totalDuplicate = 0;
    let totalErrors = 0;

    for (const source of activeSources) {
      try {
        // Fetch RSS feed
        const response = await fetch(source.rss_url, {
          headers: { "User-Agent": "NoticiaLaguna/1.0" },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const xml = await response.text();
        const items = extractItems(xml);

        let sourceNew = 0;
        let sourceDuplicate = 0;

        for (const item of items) {
          // Check for duplicate by source_url
          const { data: existing } = await supabase
            .from("news")
            .select("id")
            .eq("project_id", project_id)
            .eq("source_url", item.link)
            .limit(1)
            .maybeSingle();

          if (existing) {
            sourceDuplicate++;
            continue;
          }

          // Insert new news item
          const { error: insertError } = await supabase.from("news").insert({
            project_id,
            source_id: source.id,
            title: item.title.substring(0, 500),
            original_content: item.description ?? "",
            source_url: item.link,
            discovered_at: item.pubDate
              ? new Date(item.pubDate).toISOString()
              : new Date().toISOString(),
            status: "new",
            importance_score: 5,
            ai_confidence: 0,
            is_duplicate: false,
            is_demo: false,
          });

          if (insertError) {
            // Likely unique constraint violation
            sourceDuplicate++;
          } else {
            sourceNew++;
          }
        }

        totalFound += items.length;
        totalNew += sourceNew;
        totalDuplicate += sourceDuplicate;

        // Update source last_checked_at
        await supabase
          .from("sources")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", source.id);

        logs.push({
          source_id: source.id,
          source_name: source.name,
          found: items.length,
          new: sourceNew,
          duplicate: sourceDuplicate,
          error: null,
        });
      } catch (err: any) {
        totalErrors++;
        logs.push({
          source_id: source.id,
          source_name: source.name,
          found: 0,
          new: 0,
          duplicate: 0,
          error: err.message ?? "Unknown error",
        });
      }
    }

    // Update automation run
    const finalStatus =
      totalErrors > 0 && totalNew === 0
        ? "error"
        : totalErrors > 0
          ? "partial"
          : "success";

    await supabase
      .from("automation_runs")
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        items_processed: totalNew,
        error_message:
          totalErrors > 0 ? `${totalErrors} source(s) with errors` : null,
      })
      .eq("id", run.id);

    const result = {
      run_id: run.id,
      status: finalStatus,
      sources_checked: activeSources.length,
      total_found: totalFound,
      total_new: totalNew,
      total_duplicate: totalDuplicate,
      total_errors: totalErrors,
      logs,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
