import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analyzeAuthMiddleware } from "@/integrations/supabase/analyze-auth-middleware";
import type {
  EntradaPreview,
  ResultadoPreviewLote,
} from "@/lib/pipelinePreview.server";

/**
 * Server Function de DIAGNÓSTICO: executa o pipeline (conteúdo completo →
 * Laguna Scope → classificação → importance) em memória para notícias já
 * existentes.
 *
 * SOMENTE LEITURA: apenas SELECT. Nenhum INSERT/UPDATE/DELETE.
 * Não chama coleta, cron, edge function nem IA.
 */
type Relacao = { name: string | null } | { name: string | null }[] | null;

/** Supabase pode tipar a relação como objeto ou array; normaliza para o nome. */
function nomeRelacao(valor: Relacao): string | null {
  if (!valor) return null;
  const alvo = Array.isArray(valor) ? valor[0] : valor;
  return alvo?.name ?? null;
}

export const previewPipelineServer = createServerFn({ method: "POST" })
  .middleware([analyzeAuthMiddleware])
  .inputValidator((input) =>
    z
      .object({
        project_id: z.string().uuid("project_id inválido"),
        news_ids: z.array(z.string().uuid()).min(1).max(10),
      })
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<ResultadoPreviewLote> => {
    const { project_id, news_ids } = data;
    const { supabase, userId } = context;
    const { executarPreviewLote } = await import("@/lib/pipelinePreview.server");

    const { data: projeto, error: erroProjeto } = await supabase
      .from("projects")
      .select("id, owner_id")
      .eq("id", project_id)
      .maybeSingle();

    if (erroProjeto) throw new Error(`Erro ao validar projeto: ${erroProjeto.message}`);
    if (!projeto) throw new Error("Projeto não encontrado.");
    if (projeto.owner_id !== userId) {
      throw new Error("Você não tem permissão para inspecionar notícias deste projeto.");
    }

    const { data: noticias, error: erroNoticias } = await supabase
      .from("news")
      .select(
        "id, title, original_content, source_url, importance_score, sources(name), categories(name)",
      )
      .eq("project_id", project_id)
      .in("id", news_ids);

    if (erroNoticias) throw new Error(`Erro ao ler notícias: ${erroNoticias.message}`);
    if (!noticias || noticias.length === 0) throw new Error("Nenhuma notícia encontrada.");

    const entradas: EntradaPreview[] = noticias.map((n) => ({
      id: n.id,
      title: n.title,
      original_content: n.original_content,
      source_url: n.source_url,
      source_name: nomeRelacao(n.sources),
      categoria_atual: nomeRelacao(n.categories),
      importance_atual: n.importance_score,
    }));

    // Preserva a ordem pedida pelo administrador.
    entradas.sort((a, b) => news_ids.indexOf(a.id) - news_ids.indexOf(b.id));

    return executarPreviewLote(entradas);
  });
