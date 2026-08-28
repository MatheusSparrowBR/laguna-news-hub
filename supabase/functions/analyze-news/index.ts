import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * analyze-news Edge Function
 *
 * Receives { project_id, news_id } and performs AI analysis on a single news item.
 * Authentication: same pattern as collect-news (user JWT or automation secret key).
 *
 * Requires OPENAI_API_KEY secret configured in Supabase Edge Function secrets.
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

async function authenticate(
  req: Request,
  supabaseUrl: string,
  publishableKey: string,
  secretKeys: string,
): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization");
  const apikeyHeader = req.headers.get("apikey");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    if (token !== publishableKey && !token.startsWith("sb_")) {
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

  if (apikeyHeader && apikeyHeader.startsWith("sb_secret_")) {
    const keys = secretKeys.split(",").map((k) => k.trim()).filter(Boolean);
    const automationKey = keys[0] || null;
    if (!automationKey) {
      return { mode: "secret", error: "No automation secret key configured", status: 500 };
    }
    if (apikeyHeader === automationKey) {
      return { mode: "secret" };
    }
    return { mode: "secret", error: "Unauthorized", status: 403 };
  }

  if (apikeyHeader === publishableKey) {
    return { mode: "user", error: "No authentication provided. Send Authorization: Bearer <JWT>", status: 401 };
  }

  return { mode: "user", error: "No valid credentials provided", status: 401 };
}

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

interface AnalysisResult {
  is_relevant_to_laguna: boolean;
  relevance_confidence: number;
  category: string;
  importance_score: number;
  summary: string;
  instagram_title: string;
  instagram_caption: string;
  hashtags: string;
  suggested_art_text: string;
  moderation_status: "approved" | "review_required" | "rejected";
  moderation_notes: string;
}

const SYSTEM_PROMPT = `Você é um editor de notícias locais especializado na cidade de Laguna, Santa Catarina, Brasil.
Sua função é analisar notícias coletadas de fontes RSS e produzir conteúdo editorial para um perfil de Instagram local.

REGRAS EDITORIAIS OBRIGATÓRIAS:
1. Não inventar fatos.
2. Não inventar nomes.
3. Não inventar números.
4. Não inventar locais.
5. Não transformar opinião em fato.
6. Não transformar rumor em notícia.
7. Preservar o sentido da fonte original.
8. Manter a fonte original.
9. Não copiar longos trechos da matéria.
10. Notícias sem confiança suficiente devem exigir revisão humana.
11. Acusações contra pessoas devem exigir revisão humana.
12. Notícias de outras cidades devem ser marcadas como irrelevantes para Laguna.
13. Notícias regionais somente devem ser relevantes se houver relação clara com Laguna.
14. Conteúdo sensível deve receber revisão humana.

CLASSIFICAÇÃO DE CONFIANÇA:
- 95-100 = alta confiança (pode ser elegível para automação futura)
- 80-94 = média confiança (review_required)
- abaixo de 80 = baixa confiança (review_required ou rejected)

CATEGORIAS DISPONÍVEIS:
Urgente, Trânsito, Segurança, Prefeitura, Cidade, Eventos, Turismo, Clima, Esportes, Economia, Educação, Saúde

Resposta OBRIGATÓRIA em JSON com exatamente estes campos:
{
  "is_relevant_to_laguna": boolean,
  "relevance_confidence": number (0-100),
  "category": string (uma das categorias acima),
  "importance_score": number (1-10),
  "summary": string (resumo de 2-3 frases),
  "instagram_title": string (título curto e chamativo para Instagram, max 80 caracteres),
  "instagram_caption": string (legenda completa para Instagram, max 2200 caracteres),
  "hashtags": string (5-10 hashtags relevantes separadas por espaço),
  "suggested_art_text": string (texto curto para arte/imagem, max 60 caracteres),
  "moderation_status": "approved" | "review_required" | "rejected",
  "moderation_notes": string (explicação da classificação e decisão de moderação)
}

IMPORTANTE:
- Se a notícia NÃO é relevante para Laguna, marque is_relevant_to_laguna como false e moderation_status como "approved" (será ignorada).
- Se contém acusações contra pessoas, conteúdo sensível, ou confiança baixa: moderation_status = "review_required".
- Sempre explicar em moderation_notes POR QUE a notícia foi classificada daquela forma.
- O instagram_caption deve ser informativo, direto, sem sensacionalismo.
- Hashtags devem incluir #Laguna #LagunaSC e outras relevantes ao tema.`;

async function callOpenAI(newsTitle: string, newsContent: string, sourceUrl: string, sourceName: string): Promise<AnalysisResult> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const userMessage = `Analise esta notícia:

TÍTULO: ${newsTitle}

CONTEÚDO: ${newsContent || "(sem conteúdo disponível além do título)"}

FONTE: ${sourceName}
URL: ${sourceUrl}

Retorne SOMENTE o JSON de análise, sem markdown, sem explicação fora do JSON.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorBody.substring(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  const parsed = JSON.parse(content) as AnalysisResult;

  // Validate required fields
  if (typeof parsed.is_relevant_to_laguna !== "boolean") {
    throw new Error("Invalid AI response: missing is_relevant_to_laguna");
  }
  if (typeof parsed.relevance_confidence !== "number") {
    throw new Error("Invalid AI response: missing relevance_confidence");
  }

  return parsed;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

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

    // Authenticate
    const auth = await authenticate(req, supabaseUrl, publishableKey, secretKeys);
    if (auth.error) {
      return new Response(
        JSON.stringify({ error: auth.error }),
        { status: auth.status ?? 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Parse body
    let body: { project_id?: string; news_id?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { project_id, news_id } = body;

    if (!project_id || !news_id) {
      return new Response(
        JSON.stringify({ error: "project_id and news_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Admin client
    const supabase = createAdminClient(supabaseUrl, secretKeys);

    // Validate project and ownership
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

    if (auth.mode === "user" && project.owner_id !== auth.userId) {
      return new Response(
        JSON.stringify({ error: "Forbidden: you do not own this project" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch the news item
    const { data: newsItem, error: newsError } = await supabase
      .from("news")
      .select("id, title, original_content, source_url, project_id, source_id, sources(name)")
      .eq("id", news_id)
      .eq("project_id", project_id)
      .maybeSingle();

    if (newsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch news item" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!newsItem) {
      return new Response(
        JSON.stringify({ error: "News item not found in this project" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Update news status to analyzing
    await supabase
      .from("news")
      .update({ status: "analyzing" })
      .eq("id", news_id);

    // Call OpenAI
    const sourceName = (newsItem as any).sources?.name ?? "Fonte desconhecida";
    let analysis: AnalysisResult;
    try {
      analysis = await callOpenAI(
        newsItem.title,
        newsItem.original_content ?? "",
        newsItem.source_url ?? "",
        sourceName,
      );
    } catch (aiError: any) {
      // Revert status on AI failure
      await supabase
        .from("news")
        .update({ status: "new" })
        .eq("id", news_id);

      return new Response(
        JSON.stringify({ error: `AI analysis failed: ${aiError.message}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Determine news status based on analysis
    let newStatus: string;
    if (!analysis.is_relevant_to_laguna) {
      newStatus = "ignored";
    } else if (analysis.moderation_status === "review_required") {
      newStatus = "review_required";
    } else if (analysis.moderation_status === "rejected") {
      newStatus = "review_required"; // Don't auto-reject, send to human review
    } else if (analysis.relevance_confidence < 80) {
      newStatus = "review_required";
    } else {
      newStatus = "awaiting_approval";
    }

    // Save analysis to news_analysis table
    const { error: upsertError } = await supabase
      .from("news_analysis")
      .upsert(
        {
          news_id,
          summary: analysis.summary,
          instagram_title: analysis.instagram_title,
          instagram_caption: analysis.instagram_caption,
          hashtags: analysis.hashtags,
          suggested_art_text: analysis.suggested_art_text,
          moderation_status: analysis.moderation_status,
          moderation_notes: analysis.moderation_notes,
          analyzed_at: new Date().toISOString(),
        },
        { onConflict: "news_id" },
      );

    if (upsertError) {
      console.error("Failed to save news_analysis:", upsertError.message);
      return new Response(
        JSON.stringify({ error: "Failed to save analysis results" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Update news record
    const { error: updateError } = await supabase
      .from("news")
      .update({
        status: newStatus as any,
        importance_score: analysis.importance_score,
        ai_confidence: analysis.relevance_confidence,
      })
      .eq("id", news_id);

    if (updateError) {
      console.error("Failed to update news status:", updateError.message);
    }

    // Return full result
    const result = {
      news_id,
      project_id,
      status: newStatus,
      analysis: {
        is_relevant_to_laguna: analysis.is_relevant_to_laguna,
        relevance_confidence: analysis.relevance_confidence,
        category: analysis.category,
        importance_score: analysis.importance_score,
        summary: analysis.summary,
        instagram_title: analysis.instagram_title,
        instagram_caption: analysis.instagram_caption,
        hashtags: analysis.hashtags,
        suggested_art_text: analysis.suggested_art_text,
        moderation_status: analysis.moderation_status,
        moderation_notes: analysis.moderation_notes,
      },
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
