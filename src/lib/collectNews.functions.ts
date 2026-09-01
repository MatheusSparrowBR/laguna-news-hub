import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analyzeAuthMiddleware } from "@/integrations/supabase/analyze-auth-middleware";

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

/**
 * Server Function: coleta manual das notícias dos feeds RSS das fontes ativas.
 * Usa o cliente Supabase do usuário autenticado (RLS aplicada) e o mesmo
 * núcleo compartilhado usado pela coleta automática.
 */
export const collectNewsServer = createServerFn({ method: "POST" })
  .middleware([analyzeAuthMiddleware])
  .inputValidator((input) =>
    z.object({ project_id: z.string().uuid("project_id inválido") }).parse(input),
  )
  .handler(async ({ data, context }): Promise<CollectNewsResult> => {
    const { project_id } = data;
    const { supabase, userId } = context;
    const { executarColeta } = await import("@/lib/collectNews.server");

    const { data: projeto, error: erroProjeto } = await supabase
      .from("projects")
      .select("id, owner_id")
      .eq("id", project_id)
      .maybeSingle();

    if (erroProjeto) throw new Error(`Erro ao validar projeto: ${erroProjeto.message}`);
    if (!projeto) throw new Error("Projeto não encontrado.");
    if (projeto.owner_id !== userId) {
      throw new Error("Você não tem permissão para coletar notícias deste projeto.");
    }

    return executarColeta({ supabase, projectId: project_id, origem: "manual" });
  });
