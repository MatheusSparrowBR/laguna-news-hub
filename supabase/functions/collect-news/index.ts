import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-automation-secret",
};

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
      items.push({ title: decodeEntities(title), link, pubDate, description: description ? decodeEntities(description) : null });
    }
  }

  // Handle Atom <entry> elements if no RSS items found
  if (items.length === 0) {
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null) {
      const block = match[1];
      const title = extractTag(block, "title");
      const linkMatch = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/);
      const link = linkMatch ? linkMatch[1] : extractTag(block, "link");
      const pubDate = extractTag(block, "published") || extractTag(block, "updated");
      const description = extractTag(block, "summary") || extractTag(block, "content");

      if (title && link) {
        items.push({ title: decodeEntities(title), link, pubDate, description: description ? decodeEntities(description) : null });
      }
    }
  }

  return items;
}

function extractTag(block: string, tag: string): string | null {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i");
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

/**
 * Authentication strategy:
 * 1. User-authenticated calls: validates JWT from Authorization header.
 *    The user must be authenticated (any valid Supabase user).
 * 2. Automation calls (future cron/scheduler): validates a shared secret
 *    via x-automation-secret header. The secret must be stored in
 *    Supabase Vault as AUTOMATION_SECRET.
 *
 * The admin client uses SERVICE_ROLE_KEY stored in Supabase Vault.
 * This avoids using SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY directly.
 */
async function authenticate(req: Request, supabaseUrl: string, publishableKey: string): Promise<{ authenticated: boolean; error?: string }> {
  const authHeader = req.headers.get("authorization");
  const automationSecret = req.headers.get("x-automation-secret");

  // Strategy 1: Automation secret (for cron/scheduler)
  if (automationSecret) {
    const expectedSecret = Deno.env.get("AUTOMATION_SECRET") ?? "";
    if (!expectedSecret) {
      return { authenticated: false, error: "AUTOMATION_SECRET not configured" };
    }
    if (automationSecret === expectedSecret) {
      return { authenticated: true };
    }
    return { authenticated: false, error: "Invalid automation secret" };
  }

  // Strategy 2: User JWT
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    // Create a temporary client just to verify the user token
    const verifyClient = createClient(supabaseUrl, publishableKey);
    const { data: { user }, error } = await verifyClient.auth.getUser(token);
    if (error || !user) {
      return { authenticated: false, error: "Invalid or expired token" };
    }
    return { authenticated: true };
  }

  return { authenticated: false, error: "No authentication provided" };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    // Publishable key for JWT verification (auto-injected by Supabase runtime)
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Authenticate the request
    const auth = await authenticate(req, supabaseUrl, publishableKey);
    if (!auth.authenticated) {
      return new Response(
        JSON.stringify({ error: auth.error ?? "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { project_id } = await req.json();

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "project_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SERVICE_ROLE_KEY: stored in Supabase Vault (Edge Function Secrets).
    // NOT using SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY.
    // Configure this secret in: Supabase Dashboard > Edge Functions > Secrets
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") ?? "";

    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "SERVICE_ROLE_KEY not configured in Edge Function secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client for privileged operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey);

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

    const activeSources: SourceRow[] = (sources ?? []).filter((s: any) => s.rss_url);

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
          const { error: insertError } = await supabase
            .from("news")
            .insert({
              project_id,
              source_id: source.id,
              title: item.title.substring(0, 500),
              original_content: item.description ?? "",
              source_url: item.link,
              discovered_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
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
    const finalStatus = totalErrors > 0 && totalNew === 0 ? "error" : totalErrors > 0 ? "partial" : "success";

    await supabase
      .from("automation_runs")
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        items_processed: totalNew,
        error_message: totalErrors > 0 ? `${totalErrors} source(s) with errors` : null,
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
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
