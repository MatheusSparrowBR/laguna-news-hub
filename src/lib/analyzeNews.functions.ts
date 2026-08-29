import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  callOpenAI,
  determineNewStatus,
  persistAnalysis,
  type AnalyzeNewsOutput,
} from "@/lib/newsAnalysis.server";

const AnalyzeNewsSchema = z.object({
  project_id: z.string().uuid("project_id inválido"),
  news_id: z.string().uuid("news_id inválido"),
});

/**
 * Server Function: analyzeNewsServer
 *
 * Same-origin POST handler that replaces the browser→Edge Function flow.
 * Authentication is handled by requireSupabaseAuth middleware.
 *
 * All database operations use the user-scoped Supabase client, which
 * respects RLS. The policies on news and news_analysis enforce project
 * ownership via owns_project(), so no admin/service-role client is needed.
 *
 * Flow:
 * 1. Validate input
 * 2. Verify user owns the project (via RLS-scoped client)
 * 3. Fetch the news item
 * 4. Call OpenAI (server-side only)
 * 5. Persist results (via user-scoped client with RLS)
 * 6. Return serializable result to the browser
 */
export const analyzeNewsServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(AnalyzeNewsSchema)
  .handler(async ({ data, context }): Promise<AnalyzeNewsOutput> => {
    const { project_id, news_id } = data;
    const { supabase, userId } = context;

    // ── VALIDATE OWNERSHIP (uses user-scoped client with RLS) ────────────
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, owner_id")
      .eq("id", project_id)
      .maybeSingle();

    if (projectError) {
      throw new Error(`Erro ao validar projeto: ${projectError.message}`);
    }

    if (!project) {
      throw new Error("Projeto não encontrado.");
    }

    if (project.owner_id !== userId) {
      throw new Error("Você não tem permissão para analisar notícias deste projeto.");
    }

    // ── FETCH NEWS ITEM ──────────────────────────────────────────────────
    const { data: newsItem, error: newsError } = await supabase
      .from("news")
      .select(
        "id, title, original_content, source_url, project_id, source_id, sources(name)",
      )
      .eq("id", news_id)
      .eq("project_id", project_id)
      .maybeSingle();

    if (newsError) {
      throw new Error(`Erro ao buscar notícia: ${newsError.message}`);
    }

    if (!newsItem) {
      throw new Error("Notícia não encontrada neste projeto.");
    }

    // ── UPDATE STATUS TO ANALYZING (user-scoped, RLS enforced) ──────────
    const { error: analyzingError } = await supabase
      .from("news")
      .update({ status: "analyzing" })
      .eq("id", news_id);

    if (analyzingError) {
      throw new Error(`Erro ao atualizar status para analyzing: ${analyzingError.message}`);
    }

    // ── CALL OPENAI ─────────────────────────────────────────────────────
    const sourceName =
      (newsItem as any).sources?.name ?? "Fonte desconhecida";

    let analysis;
    try {
      analysis = await callOpenAI(
        newsItem.title,
        newsItem.original_content ?? "",
        newsItem.source_url ?? "",
        sourceName,
      );
    } catch (aiError: any) {
      // Revert status on AI failure (user-scoped, RLS enforced)
      await supabase
        .from("news")
        .update({ status: "new" })
        .eq("id", news_id);

      throw new Error(`Falha na análise de IA: ${aiError.message}`);
    }

    // ── DETERMINE STATUS ────────────────────────────────────────────────
    const newStatus = determineNewStatus(analysis);

    // ── PERSIST (user-scoped, RLS enforced) ─────────────────────────────
    await persistAnalysis(supabase, news_id, analysis, newStatus);

    // ── RETURN (no secrets, only the analysis result) ───────────────────
    return {
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
  });
