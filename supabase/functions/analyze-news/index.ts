import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * analyze-news Edge Function
 *
 * Receives { project_id, news_id } and performs AI analysis on a single news item.
 * CORS is handled explicitly with a fixed allowlist.
 * JWT is validated manually inside the function.
 *
 * Requires OPENAI_API_KEY secret configured in Supabase Edge Function secrets.
 */

// ─── CORS ─────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  "https://laguna-news-hub.lovable.app",
  "http://localhost:3000",
  "http://localhost:5173",
];

function isOriginAllowed(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin);
}

function buildCorsHeaders(origin: string): Record<string, string> {
  const headers: Record<string, string> = {
    Vary: "Origin",
  };

  if (isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Headers"] =
      "authorization, apikey, x-client-info, content-type";
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
  }

  return headers;
}

function jsonResponse(
  data: unknown,
  status: number,
  origin: string,
): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...buildCorsHeaders(origin),
  };

  return new Response(JSON.stringify(data), { status, headers });
}

// ─── OPENAI ───────────────────────────────────────────────────────────────────

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

async function callOpenAI(
  newsTitle: string,
  newsContent: string,
  sourceUrl: string,
  sourceName: string,
): Promise<AnalysisResult> {
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
    throw new Error(
      `OpenAI API error (${response.status}): ${errorBody.substring(0, 200)}`,
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  const parsed = JSON.parse(content) as AnalysisResult;

  if (typeof parsed.is_relevant_to_laguna !== "boolean") {
    throw new Error("Invalid AI response: missing is_relevant_to_laguna");
  }
  if (typeof parsed.relevance_confidence !== "number") {
    throw new Error("Invalid AI response: missing relevance_confidence");
  }

  return parsed;
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get("Origin") ?? "";
  const originAllowed = isOriginAllowed(origin);

  console.log(
    `analyze-news ${req.method} received | origin=${origin} | originAllowed=${originAllowed}`,
  );

  // ── PREFLIGHT ────────────────────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    console.log("analyze-news OPTIONS");
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(origin),
    });
  }

  // ── METHOD CHECK ─────────────────────────────────────────────────────────
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin);
  }

  try {
    // ── AUTHENTICATION ───────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (!token) {
      return jsonResponse(
        { error: "Authentication required. Please log in." },
        401,
        origin,
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      console.error("Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY");
      return jsonResponse(
        { error: "Server configuration error" },
        500,
        origin,
      );
    }

    // Validate user JWT using anon key client
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      return jsonResponse(
        { error: "Authentication required. Please log in." },
        401,
        origin,
      );
    }

    const userId = user.id;
    console.log("analyze-news authenticated user:", userId);

    // ── PARSE BODY ──────────────────────────────────────────────────────
    let body: { project_id?: string; news_id?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, origin);
    }

    const { project_id, news_id } = body;

    if (!project_id || !news_id) {
      return jsonResponse(
        { error: "project_id and news_id are required" },
        400,
        origin,
      );
    }

    // ── ADMIN CLIENT (for DB operations) ────────────────────────────────
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ── VALIDATE OWNERSHIP ──────────────────────────────────────────────
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, owner_id")
      .eq("id", project_id)
      .maybeSingle();

    if (projectError) {
      console.error("Project query error:", projectError.message);
      return jsonResponse(
        { error: "Failed to validate project" },
        500,
        origin,
      );
    }

    if (!project) {
      return jsonResponse({ error: "Project not found" }, 404, origin);
    }

    if (project.owner_id !== userId) {
      return jsonResponse(
        { error: "Forbidden: you do not own this project" },
        403,
        origin,
      );
    }

    // ── FETCH NEWS ITEM ─────────────────────────────────────────────────
    const { data: newsItem, error: newsError } = await supabase
      .from("news")
      .select(
        "id, title, original_content, source_url, project_id, source_id, sources(name)",
      )
      .eq("id", news_id)
      .eq("project_id", project_id)
      .maybeSingle();

    if (newsError) {
      console.error("News query error:", newsError.message);
      return jsonResponse(
        { error: "Failed to fetch news item" },
        500,
        origin,
      );
    }

    if (!newsItem) {
      return jsonResponse(
        { error: "News item not found in this project" },
        404,
        origin,
      );
    }

    // ── UPDATE STATUS TO ANALYZING ──────────────────────────────────────
    await supabase
      .from("news")
      .update({ status: "analyzing" })
      .eq("id", news_id);

    console.log("analyze-news: calling OpenAI for news_id:", news_id);

    // ── CALL OPENAI ─────────────────────────────────────────────────────
    const sourceName =
      (newsItem as any).sources?.name ?? "Fonte desconhecida";
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

      console.error("OpenAI error:", aiError.message);
      return jsonResponse(
        { error: `AI analysis failed: ${aiError.message}` },
        502,
        origin,
      );
    }

    // ── DETERMINE STATUS ────────────────────────────────────────────────
    let newStatus: string;
    if (!analysis.is_relevant_to_laguna) {
      newStatus = "ignored";
    } else if (analysis.moderation_status === "review_required") {
      newStatus = "review_required";
    } else if (analysis.moderation_status === "rejected") {
      newStatus = "review_required";
    } else if (analysis.relevance_confidence < 80) {
      newStatus = "review_required";
    } else {
      newStatus = "awaiting_approval";
    }

    // ── SAVE ANALYSIS ───────────────────────────────────────────────────
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
      return jsonResponse(
        { error: "Failed to save analysis results" },
        500,
        origin,
      );
    }

    // ── UPDATE NEWS RECORD ──────────────────────────────────────────────
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

    // ── RETURN RESULT ───────────────────────────────────────────────────
    const result = {
      success: true,
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

    return jsonResponse(result, 200, origin);
  } catch (err: any) {
    console.error("Unhandled error in analyze-news:", err.message);
    return jsonResponse(
      { error: err.message ?? "Internal error" },
      500,
      origin,
    );
  }
});
