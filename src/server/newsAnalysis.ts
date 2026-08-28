/**
 * Shared server-only module for news AI analysis.
 * Contains the editorial prompt, OpenAI call, response parsing,
 * status determination, and database persistence logic.
 *
 * This module must NEVER be imported by client-side code.
 * It can be used by:
 * - TanStack Start Server Functions
 * - Edge Functions (future)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface AnalysisResult {
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

export interface AnalyzeNewsInput {
  project_id: string;
  news_id: string;
}

export interface AnalyzeNewsOutput {
  success: boolean;
  news_id: string;
  project_id: string;
  status: string;
  analysis: AnalysisResult;
}

// ─── EDITORIAL PROMPT ─────────────────────────────────────────────────────────

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

// ─── OPENAI CALL ──────────────────────────────────────────────────────────────

export async function callOpenAI(
  newsTitle: string,
  newsContent: string,
  sourceUrl: string,
  sourceName: string,
): Promise<AnalysisResult> {
  const openaiKey = process.env["OPENAI_API_KEY"];
  if (!openaiKey) {
    throw new Error(
      "OPENAI_API_KEY não está configurada no ambiente server-side. Configure-a nos secrets da plataforma de hosting.",
    );
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
      Authorization: `Bearer ${openaiKey}`,
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
    throw new Error("Resposta vazia da OpenAI");
  }

  const parsed = JSON.parse(content) as AnalysisResult;

  // Validate required fields
  if (typeof parsed.is_relevant_to_laguna !== "boolean") {
    throw new Error("Resposta inválida da IA: campo is_relevant_to_laguna ausente");
  }
  if (typeof parsed.relevance_confidence !== "number") {
    throw new Error("Resposta inválida da IA: campo relevance_confidence ausente");
  }
  if (typeof parsed.importance_score !== "number") {
    throw new Error("Resposta inválida da IA: campo importance_score ausente");
  }

  return parsed;
}

// ─── STATUS DETERMINATION ─────────────────────────────────────────────────────

export function determineNewStatus(analysis: AnalysisResult): string {
  if (!analysis.is_relevant_to_laguna) {
    return "ignored";
  }
  if (analysis.moderation_status === "review_required") {
    return "review_required";
  }
  if (analysis.moderation_status === "rejected") {
    return "review_required";
  }
  if (analysis.relevance_confidence < 80) {
    return "review_required";
  }
  return "awaiting_approval";
}

// ─── PERSISTENCE ──────────────────────────────────────────────────────────────

/**
 * Persists analysis results to the database.
 * Uses an admin/service-role client because RLS INSERT/UPDATE policies
 * on news_analysis and news may not allow direct user writes.
 */
export async function persistAnalysis(
  adminClient: SupabaseClient<Database>,
  newsId: string,
  analysis: AnalysisResult,
  newStatus: string,
): Promise<void> {
  // Upsert news_analysis
  const { error: upsertError } = await adminClient
    .from("news_analysis")
    .upsert(
      {
        news_id: newsId,
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
    throw new Error(`Falha ao salvar análise: ${upsertError.message}`);
  }

  // Update news record
  const { error: updateError } = await adminClient
    .from("news")
    .update({
      status: newStatus as any,
      importance_score: analysis.importance_score,
      ai_confidence: analysis.relevance_confidence,
    })
    .eq("id", newsId);

  if (updateError) {
    throw new Error(`Falha ao atualizar notícia: ${updateError.message}`);
  }
}
