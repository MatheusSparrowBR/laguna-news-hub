import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
      // Atom link is usually <link href="..." />
      const linkMatch = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/)
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
  // Try CDATA first
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i");
  const cdataMatch = block.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  // Plain text content
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
    .replace(/<[^>]+>/g, ""); // strip any remaining HTML tags
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { project_id } = await req.json();

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "project_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    // Use the new secret key variable (set in Supabase Vault/Secrets)
    const supabaseSecretKey = Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseSecretKey) {
      return new Response(
        JSON.stringify({ error: "SUPABASE_SECRET_KEY not configured in Edge Function secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey);

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

          // Insert new news item into the "news" table with correct columns
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
            console.error(`Insert error for ${item.link}: ${insertError.message}`);
            sourceDuplicate++; // likely unique constraint
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
