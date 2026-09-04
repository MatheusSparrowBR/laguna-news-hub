/**
 * Máquina de estados da publicação + política de retry + idempotência.
 *
 * Puro e determinístico: sem rede, sem banco, sem tokens.
 */

export type PublishState =
  | "draft"
  | "awaiting_approval"
  | "approved"
  | "scheduled"
  | "queued"
  | "publishing"
  | "published"
  | "failed"
  | "cancelled";

export const PUBLISH_STATES: readonly PublishState[] = [
  "draft",
  "awaiting_approval",
  "approved",
  "scheduled",
  "queued",
  "publishing",
  "published",
  "failed",
  "cancelled",
] as const;

/** Transições permitidas. Estado final não transita (idempotência natural). */
const TRANSICOES: Record<PublishState, readonly PublishState[]> = {
  draft: ["awaiting_approval", "approved", "cancelled"],
  awaiting_approval: ["approved", "draft", "cancelled"],
  approved: ["scheduled", "queued", "draft", "cancelled"],
  scheduled: ["queued", "approved", "cancelled"],
  queued: ["publishing", "cancelled", "failed"],
  publishing: ["published", "failed"],
  published: [],
  failed: ["queued", "cancelled"],
  cancelled: [],
};

export function transicaoPermitida(de: PublishState, para: PublishState): boolean {
  if (de === para) return true; // repetir a mesma transição é idempotente
  return TRANSICOES[de].includes(para);
}

export function proximosEstados(de: PublishState): readonly PublishState[] {
  return TRANSICOES[de];
}

export function estadoFinal(estado: PublishState): boolean {
  return estado === "published" || estado === "cancelled";
}

/* ---------------------------------------------------------------- retry */

export const RETRY_MAX_TENTATIVAS = 3;
const BACKOFF_BASE_MS = 60_000;

/** Códigos permanentes: não faz sentido tentar de novo. */
const ERROS_PERMANENTES = new Set([
  "invalid_media",
  "unsupported_format",
  "asset_not_public",
  "invalid_dimensions",
  "permission_denied",
  "not_connected",
  "invalid_token",
  "duplicate_publication",
]);

export function erroPermanente(codigo: string | null | undefined): boolean {
  return !!codigo && ERROS_PERMANENTES.has(codigo);
}

export interface DecisaoRetry {
  retry: boolean;
  proximaTentativaEmMs: number | null;
  motivo: string;
}

/** Retry controlado: sem loop infinito e sem retry de erro permanente. */
export function decidirRetry(tentativa: number, codigoErro: string | null): DecisaoRetry {
  if (erroPermanente(codigoErro)) {
    return { retry: false, proximaTentativaEmMs: null, motivo: "erro permanente" };
  }
  if (tentativa >= RETRY_MAX_TENTATIVAS) {
    return { retry: false, proximaTentativaEmMs: null, motivo: "limite de tentativas atingido" };
  }
  return {
    retry: true,
    proximaTentativaEmMs: BACKOFF_BASE_MS * 2 ** (tentativa - 1),
    motivo: "erro temporário",
  };
}

/* ------------------------------------------------------------ idempotência */

/**
 * Chave de idempotência determinística para um post.
 * Mesma origem → mesma chave → não duplica publicação nem media container.
 */
export function chaveIdempotencia(partes: {
  projectId: string;
  newsId?: string | null;
  campaignId?: string | null;
  format: string;
  scheduledAt?: string | null;
}): string {
  return [
    partes.projectId,
    partes.newsId ?? "sem-noticia",
    partes.campaignId ?? "sem-campanha",
    partes.format,
    partes.scheduledAt ?? "sem-data",
  ]
    .join("|")
    .toLowerCase();
}
