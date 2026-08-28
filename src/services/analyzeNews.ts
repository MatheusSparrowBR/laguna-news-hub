import { supabase } from "@/integrations/supabase/client";

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
  news_id: string;
  project_id: string;
  status: string;
  analysis: AnalysisData;
}

/**
 * Invoca a Edge Function analyze-news para analisar uma notícia específica com IA.
 * O JWT do usuário logado é enviado automaticamente.
 */
export async function analisarNoticiaComIA(
  projectId: string,
  newsId: string,
): Promise<AnalyzeNewsResult> {
  const { data, error } = await supabase.functions.invoke<AnalyzeNewsResult>(
    "analyze-news",
    {
      body: { project_id: projectId, news_id: newsId },
    },
  );

  if (error) {
    const status = (error as any).context?.status ?? (error as any).status;
    const message = error.message ?? "Erro desconhecido";

    if (status === 401) {
      throw new Error("É necessário estar autenticado.");
    }
    if (status === 403) {
      throw new Error("Você não tem permissão para analisar notícias deste projeto.");
    }
    if (status === 404) {
      throw new Error("Projeto ou notícia não encontrada.");
    }
    if (status === 502) {
      throw new Error("Falha na análise de IA. Verifique se a OPENAI_API_KEY está configurada.");
    }

    console.error("[analyzeNews] Erro ao invocar analyze-news:", message);
    throw new Error(message);
  }

  if (!data) {
    throw new Error("Resposta vazia da Edge Function.");
  }

  return data;
}
