import { supabase } from "@/integrations/supabase/client";

export interface CollectNewsResult {
  run_id: string;
  status: string;
  sources_checked: number;
  total_found: number;
  total_new: number;
  total_duplicate: number;
  total_errors: number;
  logs: {
    source_id: string;
    source_name: string;
    found: number;
    new: number;
    duplicate: number;
    error: string | null;
  }[];
}

export async function executarColetaDeNoticias(projectId: string): Promise<CollectNewsResult> {
  const { data, error } = await supabase.functions.invoke("collect-news", {
    body: { project_id: projectId },
  });

  if (error) {
    throw new Error(error.message ?? "Erro ao executar coleta de notícias");
  }

  return data as CollectNewsResult;
}

export interface UltimaExecucao {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  items_processed: number;
  error_message: string | null;
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
