import { analyzeNewsServer } from "@/lib/analyzeNews.functions";

export interface AnalysisData {
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

export interface AnalyzeNewsResult {
  success: boolean;
  news_id: string;
  project_id: string;
  status: string;
  analysis: AnalysisData;
}

/**
 * Analisa uma notícia com IA usando a Server Function same-origin.
 *
 * A autenticação é tratada pelo analyzeAuthMiddleware integrado na
 * própria Server Function (client-side obtém sessão e injeta header,
 * server-side valida JWT e cria cliente Supabase user-scoped).
 *
 * Não é necessário enviar headers manualmente no call site.
 */
export async function analisarNoticiaComIA(
  projectId: string,
  newsId: string,
): Promise<AnalyzeNewsResult> {
  try {
    const result = await analyzeNewsServer({
      data: { project_id: projectId, news_id: newsId },
    });
    return result;
  } catch (err: any) {
    const message = err?.message ?? "Erro desconhecido ao analisar notícia.";

    // 401 — not authenticated
    if (
      message.includes("Unauthorized") ||
      message.includes("No authorization") ||
      message.includes("autenticado")
    ) {
      throw new Error("É necessário estar autenticado.");
    }

    // 403 — no access to project
    if (message.includes("permissão")) {
      throw new Error("Você não tem permissão para analisar notícias deste projeto.");
    }

    // 404 — not found
    if (message.includes("não encontrad")) {
      throw new Error("Projeto ou notícia não encontrada.");
    }

    // 502 — OpenAI failure
    if (message.includes("Falha na análise de IA") || message.includes("OpenAI")) {
      throw new Error("Erro na análise de IA. Tente novamente em alguns instantes.");
    }

    // Missing API key (operational issue)
    if (message.includes("OPENAI_API_KEY")) {
      throw new Error(
        "A chave da OpenAI não está configurada no servidor. Contacte o administrador.",
      );
    }

    // 500 — generic server error
    throw new Error(message);
  }
}
