/**
 * Modo de operação do filtro geográfico de Laguna.
 *
 * Ponto ÚNICO de configuração — não replicar essa decisão em outros arquivos.
 *
 *  - "shadow"        → nada é bloqueado; tudo é inserido; a decisão é observada.
 *  - "review"        → tudo é inserido, mas "outside" nunca segue automaticamente:
 *                      entra na fila editorial de revisão.
 *  - "block_outside" → "outside" não entra no fluxo editorial normal; o item é
 *                      registrado com motivo (auditabilidade) e não publica.
 *
 * Fase atual: shadow. block_outside NÃO deve ser ativado sem decisão explícita.
 */
import type { ScopeDecision } from "./lagunaScope";

export type GeoFilterMode = "shadow" | "review" | "block_outside";

export const GEO_FILTER_MODES: readonly GeoFilterMode[] = [
  "shadow",
  "review",
  "block_outside",
] as const;

export const GEOGRAPHIC_FILTER_MODE: GeoFilterMode = "shadow";

/** Situação de revisão geográfica atribuída no momento da coleta. */
export type GeoReviewStatus = "pending" | "reviewed" | "skipped";

/**
 * Decide se um item pode seguir para o INSERT.
 * Em shadow e review, todas as decisões são inseridas (a diferença está no fluxo
 * editorial posterior). Em block_outside, "outside" não é inserido.
 */
export function permiteInsercao(
  decision: ScopeDecision,
  mode: GeoFilterMode = GEOGRAPHIC_FILTER_MODE,
): boolean {
  if (mode === "block_outside") return decision !== "outside";
  return true;
}

/**
 * Decide se o item pode seguir automaticamente no fluxo editorial
 * (sem passar obrigatoriamente por decisão humana de geografia).
 */
export function permiteFluxoAutomatico(
  decision: ScopeDecision,
  mode: GeoFilterMode = GEOGRAPHIC_FILTER_MODE,
): boolean {
  if (mode === "shadow") return true;
  return decision === "local";
}

/** Situação de revisão geográfica inicial para uma notícia recém-coletada. */
export function situacaoRevisaoInicial(
  decision: ScopeDecision,
  mode: GeoFilterMode = GEOGRAPHIC_FILTER_MODE,
): GeoReviewStatus {
  if (mode === "shadow") return "pending";
  if (decision === "local") return "skipped";
  return "pending";
}

/**
 * Situação inicial da notícia recém-inserida.
 * Em `review`, decisão não-local entra na fila de revisão em vez de seguir
 * como notícia normal. Em `shadow`, nada muda.
 */
export function statusInicialNoticia(
  decision: ScopeDecision,
  mode: GeoFilterMode = GEOGRAPHIC_FILTER_MODE,
): "new" | "review_required" {
  return permiteFluxoAutomatico(decision, mode) ? "new" : "review_required";
}

/** Motivo auditável de bloqueio, quando houver. */
export function motivoBloqueio(
  decision: ScopeDecision,
  mode: GeoFilterMode = GEOGRAPHIC_FILTER_MODE,
): string | null {
  if (mode === "block_outside" && decision === "outside") {
    return "bloqueado por filtro geográfico: fora de Laguna (modo block_outside)";
  }
  return null;
}

