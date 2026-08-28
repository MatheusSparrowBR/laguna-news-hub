import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withSupabase } from "npm:@supabase/server@^1";

/**
 * analyze-news Edge Function
 *
 * Receives { project_id, news_id } and performs AI analysis on a single news item.
 * Authentication and CORS handled by @supabase/server withSupabase({ auth: 'user' }).
 *
 * Requires OPENAI_API_KEY secret configured in Supabase Edge Function secrets.
 */

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

export default {
  fetch: withSupabase(
    { auth: "user" },
    async (req: Request, ctx: any): Promise<Response> => {
      console.log("analyze-news POST received");

      // ── METHOD CHECK ───────────────────────────────────────────────────────
      if (req.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
      }

      try {
        // ── GET AUTHENTICATED USER FROM CONTEXT ────────────────────────────
        const user = ctx.user;
        if (!user) {
          return Response.json(
            { error: "Authentication required. Please log in." },
            { status: 401 },
          );
        }

        const userId = user.id;
        console.log("analyze-news authenticated user:", userId);

        // ── PARSE BODY ─────────────────────────────────────────────────────
        let body: { project_id?: string; news_id?: string };
        try {
          body = await req.json();
        } catch {
          return Response.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const { project_id, news_id } = body;

        if (!project_id || !news_id) {
          return Response.json(
            { error: "project_id and news_id are required" },
            { status: 400 },
          );
        }

        // ── ADMIN CLIENT (for DB operations) ──────────────────────────────
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        if (!supabaseUrl || !serviceRoleKey) {
          console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
          return Response.json(
            { error: "Server configuration error" },
            { status: 500 },
          );
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        // ── VALIDATE OWNERSHIP ─────────────────────────────────────────────
        const { data: project, error: projectError } = await supabase
          .from("projects")
          .select("id, owner_id")
          .eq("id", project_id)
          .maybeSingle();

        if (projectError) {
          console.error("Project query error:", projectError.message);
          return Response.json(
            { error: "Failed to validate project" },
            { status: 500 },
          );
        }

        if (!project) {
          return Response.json({ error: "Project not found" }, { status: 404 });
        }

        if (project.owner_id !== userId) {
          return Response.json(
            { error: "Forbidden: you do not own this project" },
            { status: 403 },
          );
        }

        // ── FETCH NEWS ITEM ───────────────────────────────────────────────
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
          return Response.json(
            { error: "Failed to fetch news item" },
            { status: 500 },
          );
        }

        if (!newsItem) {
          return Response.json(
            { error: "News item not found in this project" },
            { status: 404 },
          );
        }

        // ── UPDATE STATUS TO ANALYZING ────────────────────────────────────
        await supabase
          .from("news")
          .update({ status: "analyzing" })
          .eq("id", news_id);

        console.log("analyze-news: calling OpenAI for news_id:", news_id);

        // ── CALL OPENAI ───────────────────────────────────────────────────
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
          return Response.json(
            { error: `AI analysis failed: ${aiError.message}` },
            { status: 502 },
          );
        }

        // ── DETERMINE STATUS ──────────────────────────────────────────────
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

        // ── SAVE ANALYSIS ─────────────────────────────────────────────────
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
          return Response.json(
            { error: "Failed to save analysis results" },
            { status: 500 },
          );
        }

        // ── UPDATE NEWS RECORD ────────────────────────────────────────────
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

        // ── RETURN RESULT ─────────────────────────────────────────────────
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

        return Response.json(result, { status: 200 });
      } catch (err: any) {
        console.error("Unhandled error in analyze-news:", err.message);
        return Response.json(
          { error: err.message ?? "Internal error" },
          { status: 500 },
        );
      }
    },
  ),
};
