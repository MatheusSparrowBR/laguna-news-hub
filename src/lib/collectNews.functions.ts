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
  error: string | null;
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

/**
 * Server Function: coleta notícias dos feeds RSS das fontes ativas do projeto.
 * Usa o cliente Supabase do usuário autenticado (RLS aplicada).
 */
export const collectNewsServer = createServerFn({ method: "POST" })
  .middleware([analyzeAuthMiddleware])
  .inputValidator((input) =>
    z.object({ project_id: z.string().uuid("project_id inválido") }).parse(input),
  )
  .handler(async ({ data, context }): Promise<CollectNewsResult> => {
    const { project_id } = data;
    const { supabase, userId } = context;
    const { buscarFeed, dataParaIso } = await import("@/lib/collectNews.server");

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

    const { data: run, error: erroRun } = await supabase
      .from("automation_runs")
      .insert({
        project_id,
        run_type: "source_scan",
        status: "running",
        started_at: new Date().toISOString(),
        items_processed: 0,
      })
      .select("id")
      .single();

    if (erroRun || !run) {
      throw new Error(`Erro ao registrar execução: ${erroRun?.message ?? "desconhecido"}`);
    }

    const { data: fontes, error: erroFontes } = await supabase
      .from("sources")
      .select("id, name, rss_url")
      .eq("project_id", project_id)
      .eq("active", true)
      .not("rss_url", "is", null);

    if (erroFontes) throw new Error(`Erro ao buscar fontes: ${erroFontes.message}`);

    const ativas = (fontes ?? []).filter((f) => !!f.rss_url);
    const logs: CollectNewsSourceLog[] = [];
    let totalFound = 0;
    let totalNew = 0;
    let totalDuplicate = 0;
    let totalErrors = 0;

    for (const fonte of ativas) {
      try {
        const itens = await buscarFeed(fonte.rss_url as string);

        let novas = 0;
        let duplicadas = 0;

        for (const item of itens) {
          const { data: existente } = await supabase
            .from("news")
            .select("id")
            .eq("project_id", project_id)
            .eq("source_url", item.link)
            .limit(1)
            .maybeSingle();

          if (existente) {
            duplicadas++;
            continue;
          }

          const { error: erroInsert } = await supabase.from("news").insert({
            project_id,
            source_id: fonte.id,
            title: item.title.substring(0, 500),
            original_content: item.description ?? "",
            source_url: item.link,
            discovered_at: dataParaIso(item.pubDate),
            status: "new",
            importance_score: 5,
            ai_confidence: 0,
            is_duplicate: false,
            is_demo: false,
          });

          if (erroInsert) duplicadas++;
          else novas++;
        }

        totalFound += itens.length;
        totalNew += novas;
        totalDuplicate += duplicadas;

        await supabase
          .from("sources")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", fonte.id);

        logs.push({
          source_id: fonte.id,
          source_name: fonte.name,
          rss_url: fonte.rss_url,
          found: itens.length,
          new: novas,
          duplicate: duplicadas,
          error: null,
        });
      } catch (erro: any) {
        totalErrors++;
        logs.push({
          source_id: fonte.id,
          source_name: fonte.name,
          rss_url: fonte.rss_url,
          found: 0,
          new: 0,
          duplicate: 0,
          error: erro?.message ?? "Erro desconhecido",
        });
      }
    }

    const status = totalErrors > 0 && totalNew === 0 ? "failed" : totalErrors > 0 ? "partial" : "completed";

    await supabase
      .from("automation_runs")
      .update({
        status: status as "completed" | "failed" | "partial",
        completed_at: new Date().toISOString(),
        items_processed: totalNew,
        error_message: totalErrors > 0 ? `${totalErrors} fonte(s) com erro` : null,
      })
      .eq("id", run.id);

    return {
      run_id: run.id,
      status,
      project_id,
      sources_checked: ativas.length,
      total_found: totalFound,
      total_new: totalNew,
      total_duplicate: totalDuplicate,
      total_errors: totalErrors,
      logs,
    };
  });
