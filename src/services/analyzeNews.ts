import { supabase } from "@/integrations/supabase/client";
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";

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
 * Invoca a Edge Function analyze-news para analisar uma notícia específica com IA.
 * O JWT do usuário logado é enviado automaticamente pelo cliente Supabase.
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
    // Differentiate error types from the Supabase SDK
    if (error instanceof FunctionsHttpError) {
      const status = error.context?.status ?? 500;
      let message = `Erro HTTP ${status}`;
      try {
        const errorBody = await error.context.json();
        if (errorBody?.error) {
          message = errorBody.error;
        }
      } catch {
        // Could not parse body, use generic message
      }

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
        throw new Error(`Falha na análise de IA: ${message}`);
      }
      throw new Error(message);
    }

    if (error instanceof FunctionsFetchError) {
      console.error("[analyzeNews] FunctionsFetchError:", error.message);
      throw new Error(
        "Erro de conexão com a Edge Function. Verifique se a função está deployada e acessível (possível problema de CORS ou rede).",
      );
    }

    if (error instanceof FunctionsRelayError) {
      console.error("[analyzeNews] FunctionsRelayError:", error.message);
      throw new Error(
        "Erro de relay na Edge Function. A função pode ter falhado durante a execução.",
      );
    }

    // Generic fallback
    const message = error.message ?? "Erro desconhecido";
    console.error("[analyzeNews] Erro ao invocar analyze-news:", message);
    throw new Error(message);
  }

  if (!data) {
    throw new Error("Resposta vazia da Edge Function.");
  }

  return data;
}
