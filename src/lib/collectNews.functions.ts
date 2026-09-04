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
 * Coleta manual das notícias dos feeds RSS das fontes ativas.
 *
 * A requisição continua sendo autenticada e o projeto é validado com o
 * cliente RLS do usuário. Depois dessa autorização, a execução usa o
 * cliente privilegiado somente no servidor, porque automation_runs é uma
 * tabela de infraestrutura protegida contra INSERT/UPDATE pelo frontend.
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
    const { criarClienteAdmin } = await import("@/lib/adminClient.server");

    // Authorization MUST happen with the user's RLS-scoped client first.
    const { data: projeto, error: erroProjeto } = await supabase
      .from("projects")
      .select("id, owner_id")
      .eq("id", project_id)
      .maybeSingle();

    if (erroProjeto) {
      throw new Error(`Erro ao validar projeto: ${erroProjeto.message}`);
    }
    if (!projeto) {
      throw new Error("Projeto não encontrado.");
    }
    if (projeto.owner_id !== userId) {
      throw new Error("Você não tem permissão para coletar notícias deste projeto.");
    }

    // After ownership is proven, use the privileged client for the internal
    // run ledger and all collection writes. The project_id is fixed to the
    // already-authorized project and never taken from an untrusted fallback.
    const supabaseAdmin = criarClienteAdmin();

    return executarColeta({
      supabase: supabaseAdmin,
      projectId: project_id,
      origem: "manual",
    });
  });
