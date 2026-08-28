import { supabase } from "@/integrations/supabase/client";

export interface CollectNewsSourceLog {
  source_id: string;
  source_name: string;
  rss_url?: string | null;
  found: number;
  new: number;
  duplicate: number;
  error: string | null;
  content_type?: "xml" | "html" | "error" | null;
  insert_errors?: number;
}

export interface CollectNewsResult {
  run_id: string;
  status: string;
  project_id: string;
  sources_checked: number;
  total_found: number;
  total_new: number;
  total_duplicate: number;
  total_errors: number;
  logs: CollectNewsSourceLog[];
}

export interface UltimaExecucao {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  items_processed: number;
  error_message: string | null;
}

/**
 * Invoca a Edge Function collect-news usando o cliente Supabase autenticado.
 * O JWT do usuário logado é enviado automaticamente — nenhuma secret key é usada.
 */
export async function executarColetaDeNoticias(projectId: string): Promise<CollectNewsResult> {
  const { data, error } = await supabase.functions.invoke<CollectNewsResult>(
    "collect-news",
    {
      body: { project_id: projectId },
    },
  );

  if (error) {
    // supabase.functions.invoke retorna error com context (status, message)
    const status = (error as any).context?.status ?? (error as any).status;
    const message = error.message ?? "Erro desconhecido";

    if (status === 401) {
      throw new Error("É necessário estar autenticado.");
    }
    if (status === 403) {
      throw new Error("Você não tem permissão para executar a coleta deste projeto.");
    }
    if (status === 404) {
      throw new Error("Projeto não encontrado.");
    }
    if (status === 500) {
      console.error("[collectNews] Erro interno da Edge Function:", message);
      throw new Error("Erro interno durante a coleta. Verifique os logs da Edge Function.");
    }

    console.error("[collectNews] Erro ao invocar collect-news:", message);
    throw new Error(message);
  }

  if (!data) {
    throw new Error("Resposta vazia da Edge Function.");
  }

  // Enrich result with project_id used
  return {
    ...data,
    project_id: data.project_id ?? projectId,
  };
}

export async function obterUltimaExecucao(projectId: string): Promise<UltimaExecucao | null> {
  const { data, error } = await supabase
    .from("automation_runs")
    .select("id, status, started_at, completed_at, items_processed, error_message")
    .eq("project_id", projectId)
    .eq("run_type", "source_scan")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
