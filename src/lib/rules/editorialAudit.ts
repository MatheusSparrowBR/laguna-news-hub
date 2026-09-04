/**
 * Regras de idempotência da auditoria editorial.
 *
 * Ponto único de decisão: só registramos auditoria quando houve mudança real.
 * A decisão automática (geográfica) nunca é substituída pela manual — apenas
 * comparamos a decisão manual vigente com a nova.
 */

export type StatusEditorial = "approved" | "rejected" | "review_required" | "archived";
export type DecisaoGeo = "local" | "outside" | "uncertain";

/** Verdadeiro quando o status muda de fato (logo, precisa gravar + auditar). */
export function houveMudancaStatus(anterior: string | null | undefined, novo: StatusEditorial): boolean {
  return anterior !== novo;
}

/**
 * Verdadeiro quando a decisão manual muda de fato.
 * Sem decisão manual anterior, comparamos com a decisão automática vigente,
 * que continua armazenada intacta.
 */
export function houveMudancaGeo(
  manualAnterior: DecisaoGeo | null | undefined,
  automatica: DecisaoGeo | null | undefined,
  nova: DecisaoGeo,
): boolean {
  const vigente = manualAnterior ?? automatica ?? null;
  return vigente !== nova;
}
