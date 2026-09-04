/**
 * Regras de idempotência da auditoria editorial.
 *
 * O banco usa `ignored` para itens arquivados/descartados. A interface pode
 * continuar chamando essa ação de `archived`, mas a camada de persistência
 * converte o valor antes de tocar no status do banco.
 */

export type StatusEditorial = "approved" | "rejected" | "review_required" | "archived";
export type StatusBancoEditorial = "approved" | "ignored" | "review_required";
export type DecisaoGeo = "local" | "outside" | "uncertain";

/** Verdadeiro quando o status muda de fato. */
export function houveMudancaStatus(anterior: string | null | undefined, novo: StatusBancoEditorial): boolean {
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
