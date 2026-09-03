/**
 * Preview do pipeline de processamento de UMA notícia já existente (server-only).
 *
 * Invariantes deste módulo:
 *  - SOMENTE LEITURA: não faz INSERT/UPDATE/DELETE, não toca no banco.
 *  - Não usa IA, não usa secrets, não lê Authorization/cookies.
 *  - Reutiliza os módulos existentes (articleContent.server, lagunaScope,
 *    newsClassification); nenhuma lógica é duplicada.
 *  - Nunca lança exceção: falhas de rede voltam como status "error".
 */
import {
  buscarConteudoCompleto,
  mapearComLimite,
  type OrigemConteudo,
} from "@/lib/articleContent.server";
import { avaliarEscopoLaguna, type ResultadoEscopo } from "@/lib/rules/lagunaScope";
import {
  classificarNoticia,
  type CategoriaSlug,
  type ResultadoClassificacao,
} from "@/lib/rules/newsClassification";

/** Máximo de notícias por execução em lote. */
export const PREVIEW_MAX_LOTE = 10;
/** Concorrência máxima do lote. */
export const PREVIEW_CONCORRENCIA = 4;

export type StatusFetchPreview = "success" | "fallback-rss" | "error";

export interface EntradaPreview {
  id: string;
  title: string;
  /** Lead vindo do RSS, já gravado em news.original_content. */
  original_content?: string | null | undefined;
  source_url?: string | null | undefined;
  source_name?: string | null | undefined;
  /** Nome (ou slug) da categoria atualmente gravada. */
  categoria_atual?: string | null | undefined;
  importance_atual?: number | null | undefined;
}

export interface AvaliacaoPreview {
  geo: ResultadoEscopo;
  classificacao: ResultadoClassificacao;
}

export interface ResultadoPreview {
  id: string;
  title: string;
  source_name: string | null;
  source_url: string | null;

  /** Qual conteúdo alimentou a avaliação final. */
  conteudo_usado: "COMPLETO" | "RSS";
  rss_chars: number;
  full_chars: number;

  fetch_status: StatusFetchPreview;
  http_status: number | null;
  fetch_ms: number;
  fetch_via: OrigemConteudo | null;
  fetch_reason: string | null;

  categoria_atual: string | null;
  importance_atual: number | null;

  /** Avaliação com o lead do RSS (baseline). */
  com_rss: AvaliacaoPreview;
  /** Avaliação com o corpo completo (null quando não houve corpo completo). */
  com_full: AvaliacaoPreview | null;
  /** Avaliação efetiva = com_full quando existir, senão com_rss. */
  final: AvaliacaoPreview;
}

export interface OpcoesPreview {
  /** Injetável nos testes; padrão: fetch global. */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
  /** Injetável nos testes (relógio monotônico). */
  agora?: () => number;
}

function avaliar(entrada: EntradaPreview, conteudo: string | null): AvaliacaoPreview {
  return {
    geo: avaliarEscopoLaguna({
      title: entrada.title,
      content: conteudo,
      source: entrada.source_name ?? null,
    }),
    classificacao: classificarNoticia({
      title: entrada.title,
      content: conteudo,
      source: entrada.source_name ?? null,
    }),
  };
}

/**
 * Executa o pipeline em memória para uma notícia existente.
 * Nunca grava nada e nunca lança.
 */
export async function executarPreviewNoticia(
  entrada: EntradaPreview,
  opcoes: OpcoesPreview = {},
): Promise<ResultadoPreview> {
  const rss = (entrada.original_content ?? "").trim();
  const comRss = avaliar(entrada, rss || null);

  const base: ResultadoPreview = {
    id: entrada.id,
    title: entrada.title,
    source_name: entrada.source_name ?? null,
    source_url: entrada.source_url ?? null,
    conteudo_usado: "RSS",
    rss_chars: rss.length,
    full_chars: 0,
    fetch_status: "fallback-rss",
    http_status: null,
    fetch_ms: 0,
    fetch_via: null,
    fetch_reason: null,
    categoria_atual: entrada.categoria_atual ?? null,
    importance_atual: entrada.importance_atual ?? null,
    com_rss: comRss,
    com_full: null,
    final: comRss,
  };

  const url = (entrada.source_url ?? "").trim();
  if (!url) {
    return { ...base, fetch_status: "error", fetch_reason: "sem-source-url" };
  }

  const agora = opcoes.agora ?? (() => Date.now());
  const fetchBase = opcoes.fetchImpl ?? fetch;

  // Captura o HTTP status sem alterar articleContent.server.ts.
  let httpStatus: number | null = null;
  const fetchInstrumentado: typeof fetch = async (input, init) => {
    const resposta = await fetchBase(input, init);
    httpStatus = resposta.status;
    return resposta;
  };

  const inicio = agora();
  const resultado = await buscarConteudoCompleto(url, {
    fetchImpl: fetchInstrumentado,
    ...(opcoes.timeoutMs === undefined ? {} : { timeoutMs: opcoes.timeoutMs }),
    ...(opcoes.maxRetries === undefined ? {} : { maxRetries: opcoes.maxRetries }),
  });
  const fetchMs = Math.max(0, agora() - inicio);

  const corpo = resultado.success ? (resultado.content ?? "").trim() : "";
  if (!corpo) {
    const semRede =
      resultado.reason !== undefined &&
      /^(http-|timeout-|rede|url-invalida|corpo-ilegivel|content-type-)/.test(resultado.reason);
    return {
      ...base,
      fetch_status: semRede ? "error" : "fallback-rss",
      http_status: httpStatus,
      fetch_ms: fetchMs,
      fetch_reason: resultado.reason ?? "conteudo-vazio",
    };
  }

  const comFull = avaliar(entrada, corpo);
  return {
    ...base,
    conteudo_usado: "COMPLETO",
    full_chars: corpo.length,
    fetch_status: "success",
    http_status: httpStatus,
    fetch_ms: fetchMs,
    fetch_via: resultado.via ?? null,
    com_full: comFull,
    final: comFull,
  };
}

export interface ResumoPreviewLote {
  total: number;
  uncertain_para_local: number;
  uncertain_para_outside: number;
  uncertain_para_uncertain: number;
  categoria_mudou: number;
}

export interface ResultadoPreviewLote {
  itens: ResultadoPreview[];
  resumo: ResumoPreviewLote;
}

function slugDe(avaliacao: AvaliacaoPreview): CategoriaSlug {
  return avaliacao.classificacao.category_slug;
}

/** Executa o preview em até 10 notícias, concorrência 4, somente leitura. */
export async function executarPreviewLote(
  entradas: readonly EntradaPreview[],
  opcoes: OpcoesPreview = {},
): Promise<ResultadoPreviewLote> {
  const selecionadas = entradas.slice(0, PREVIEW_MAX_LOTE);
  const itens = await mapearComLimite(selecionadas, PREVIEW_CONCORRENCIA, (entrada) =>
    executarPreviewNoticia(entrada, opcoes),
  );

  const resumo: ResumoPreviewLote = {
    total: itens.length,
    uncertain_para_local: 0,
    uncertain_para_outside: 0,
    uncertain_para_uncertain: 0,
    categoria_mudou: 0,
  };

  for (const item of itens) {
    if (item.com_rss.geo.decision === "uncertain") {
      const destino = item.final.geo.decision;
      if (destino === "local") resumo.uncertain_para_local += 1;
      else if (destino === "outside") resumo.uncertain_para_outside += 1;
      else resumo.uncertain_para_uncertain += 1;
    }
    if (item.com_full && slugDe(item.com_full) !== slugDe(item.com_rss)) {
      resumo.categoria_mudou += 1;
    }
  }

  return { itens, resumo };
}
