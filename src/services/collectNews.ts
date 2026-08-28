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

export interface UltimaExecucao {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  items_processed: number;
  error_message: string | null;
}

/**
 * Registra uma execução manual de coleta.
 * Como não estamos usando Edge Functions, esta função apenas
 * registra o run na tabela automation_runs e retorna um resultado
 * informativo baseado nas fontes cadastradas.
 *
 * A coleta real de RSS/sites deve ser implementada futuramente
 * via cron job ou outro mecanismo server-side.
 */
export async function executarColetaDeNoticias(projectId: string): Promise<CollectNewsResult> {
  // Buscar fontes ativas do projeto
  const { data: fontes, error: erroFontes } = await supabase
    .from("sources")
    .select("id, name, source_type, active")
    .eq("project_id", projectId)
    .eq("active", true);

  if (erroFontes) {
    throw new Error(erroFontes.message ?? "Erro ao buscar fontes");
  }

  const sourcesChecked = (fontes ?? []).length;

  // Registrar a execução na tabela automation_runs
  const { data: run, error: erroRun } = await supabase
    .from("automation_runs")
    .insert({
      project_id: projectId,
      run_type: "source_scan",
      status: "completed",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      items_processed: 0,
      error_message: sourcesChecked === 0 ? "Nenhuma fonte ativa encontrada" : null,
    })
    .select("id")
    .single();

  if (erroRun) {
    throw new Error(erroRun.message ?? "Erro ao registrar execução");
  }

  const logs = (fontes ?? []).map((f) => ({
    source_id: f.id,
    source_name: f.name,
    found: 0,
    new: 0,
    duplicate: 0,
    error: f.source_type === "website"
      ? "Coleta automática de websites ainda não implementada"
      : "Coleta server-side não disponível no momento (Edge Functions desabilitadas)",
  }));

  return {
    run_id: run?.id ?? "",
    status: "completed",
    sources_checked: sourcesChecked,
    total_found: 0,
    total_new: 0,
    total_duplicate: 0,
    total_errors: sourcesChecked > 0 ? sourcesChecked : 0,
    logs,
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
