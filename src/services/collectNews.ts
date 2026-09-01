import { supabase } from "@/integrations/supabase/client";
import { collectNewsServer } from "@/lib/collectNews.functions";

export interface CollectNewsSourceLog {
  source_id: string;
  source_name: string;
  rss_url?: string | null;
  found: number;
  new: number;
  duplicate: number;
  insert_errors: number;
  content_type: "xml" | "html" | "error" | null;
  error: string | null;
}

export interface CollectNewsResult {
  run_id: string | null;
  status: string;
  project_id: string;
  sources_checked: number;
  total_found: number;
  total_new: number;
  total_duplicate: number;
  total_insert_errors: number;
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
 * Executa a coleta chamando a server function do próprio app (sem Edge Function).
 * O token do usuário logado é anexado automaticamente pelo middleware do cliente.
 */
export async function executarColetaDeNoticias(projectId: string): Promise<CollectNewsResult> {
  try {
    const resultado = await collectNewsServer({ data: { project_id: projectId } });
    return { ...resultado, project_id: resultado.project_id ?? projectId } as CollectNewsResult;
  } catch (erro: any) {
    const mensagem = erro?.message ?? "Erro desconhecido durante a coleta.";
    console.error("[collectNews] Erro ao executar a coleta:", mensagem);
    throw new Error(mensagem);
  }
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
