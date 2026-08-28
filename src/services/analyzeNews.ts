import { analyzeNewsServer } from "@/server/analyzeNewsServer";

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
 * Substitui a chamada anterior à Edge Function analyze-news.
 * O JWT do usuário é enviado automaticamente pelo middleware attachSupabaseAuth.
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
    // Parse error messages from the server function
    const message = err?.message ?? "Erro desconhecido ao analisar notícia.";

    if (message.includes("Unauthorized") || message.includes("No authorization")) {
      throw new Error("É necessário estar autenticado.");
    }
    if (message.includes("permissão")) {
      throw new Error("Você não tem permissão para analisar notícias deste projeto.");
    }
    if (message.includes("não encontrad")) {
      throw new Error("Projeto ou notícia não encontrada.");
    }
    if (message.includes("OPENAI_API_KEY")) {
      throw new Error(
        "A chave da OpenAI não está configurada no servidor. Contacte o administrador.",
      );
    }

    throw new Error(message);
  }
}
