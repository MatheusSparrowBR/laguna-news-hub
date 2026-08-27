import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RssItem {
  title: string;
  link: string;
  pubDate: string | null;
  imageUrl: string | null;
  description: string | null;
}

function extractText(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>|<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  if (!match) return null;
  return (match[1] ?? match[2] ?? "").trim();
}

function extractImageFromItem(itemXml: string): string | null {
  // Try media:content or media:thumbnail
  const mediaMatch = itemXml.match(/<media:(content|thumbnail)[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch) return mediaMatch[2];

  // Try enclosure with image type
  const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/i);
  if (enclosureMatch) return enclosureMatch[1];

  // Try image tag inside item
  const imgMatch = itemXml.match(/<image>\s*<url>([^<]+)<\/url>/i);
  if (imgMatch) return imgMatch[1].trim();

  // Try img tag in description/content
  const imgTagMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgTagMatch) return imgTagMatch[1];

  return null;
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];

  // Match <item> or <entry> blocks
  const itemRegex = /<(item|entry)[^>]*>[\s\S]*?<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[0];

    const title = extractText(block, "title");
    if (!title) continue;

    // Link: <link> text or <link href="..." />
    let link = extractText(block, "link");
    if (!link) {
      const linkHrefMatch = block.match(/<link[^>]+href=["']([^"']+)["']/i);
      if (linkHrefMatch) link = linkHrefMatch[1];
    }
    if (!link) continue;

    const pubDate = extractText(block, "pubDate") ?? extractText(block, "published") ?? extractText(block, "updated");
    const description = extractText(block, "description") ?? extractText(block, "summary") ?? extractText(block, "content");
    const imageUrl = extractImageFromItem(block);

    items.push({
      title: title.replace(/<[^>]+>/g, "").trim(),
      link: link.trim(),
      pubDate,
      imageUrl,
      description: description ? description.replace(/<[^>]+>/g, "").trim().slice(0, 2000) : null,
    });
  }

  return items;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get project_id from body or use first project
    let projectId: string | null = null;
    try {
      const body = await req.json();
      projectId = body?.project_id ?? null;
    } catch {
      // no body
    }

    if (!projectId) {
      const { data: proj } = await supabase
        .from("projects")
        .select("id")
        .eq("active", true)
        .order("created_at")
        .limit(1)
        .maybeSingle();
      projectId = proj?.id ?? null;
    }

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "No active project found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create automation run
    const { data: run, error: runError } = await supabase
      .from("automation_runs")
      .insert({
        project_id: projectId,
        run_type: "source_scan",
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (runError) throw runError;
    const runId = run.id;

    // Fetch active RSS sources
    const { data: sources, error: srcError } = await supabase
      .from("sources")
      .select("id, name, rss_url, source_type")
      .eq("project_id", projectId)
      .eq("active", true);

    if (srcError) throw srcError;

    const rssSources = (sources ?? []).filter(
      (s: any) => s.source_type === "rss" && s.rss_url
    );

    const logs: any[] = [];
    let totalFound = 0;
    let totalNew = 0;
    let totalDuplicate = 0;
    let totalErrors = 0;

    for (const source of rssSources) {
      const sourceLog: any = {
        source_id: source.id,
        source_name: source.name,
        found: 0,
        new: 0,
        duplicate: 0,
        error: null,
      };

      try {
        const response = await fetch(source.rss_url, {
          headers: { "User-Agent": "LagunaNewsBot/1.0" },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const xml = await response.text();
        const items = parseRss(xml);
        sourceLog.found = items.length;
        totalFound += items.length;

        for (const item of items) {
          // Check for duplicates by source_url
          const { data: existing } = await supabase
            .from("news")
            .select("id")
            .eq("project_id", projectId)
            .eq("source_url", item.link)
            .limit(1)
            .maybeSingle();

          if (existing) {
            sourceLog.duplicate++;
            totalDuplicate++;
            continue;
          }

          // Insert new news
          const { error: insertError } = await supabase.from("news").insert({
            project_id: projectId,
            source_id: source.id,
            title: item.title.slice(0, 500),
            original_content: item.description,
            source_url: item.link,
            image_url: item.imageUrl,
            city: "Laguna",
            state: "SC",
            status: "new",
            is_demo: false,
            discovered_at: new Date().toISOString(),
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
            importance_score: 0,
            ai_confidence: 0,
          });

          if (insertError) {
            console.error("Insert error:", insertError);
          } else {
            sourceLog.new++;
            totalNew++;
          }
        }

        // Update last_checked_at
        await supabase
          .from("sources")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", source.id);
      } catch (err: any) {
        sourceLog.error = err.message ?? String(err);
        totalErrors++;
        console.error(`Error processing source ${source.name}:`, err);
      }

      logs.push(sourceLog);
    }

    // Update automation run
    const finalStatus = totalErrors > 0 && totalNew > 0 ? "partial" : totalErrors > 0 ? "failed" : "completed";
    await supabase
      .from("automation_runs")
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        items_processed: totalNew,
        error_message: totalErrors > 0 ? `${totalErrors} source(s) failed` : null,
      })
      .eq("id", runId);

    const result = {
      run_id: runId,
      status: finalStatus,
      sources_checked: rssSources.length,
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
    console.error("collect-news error:", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
