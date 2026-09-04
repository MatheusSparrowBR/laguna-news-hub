/**
 * Saúde das fontes — módulo PURO (sem rede, sem Supabase).
 *
 * Ponto único de decisão sobre o estado de uma fonte e sobre os campos
 * gravados em `sources` após cada verificação da coleta.
 */

export type EstadoFonte = "saudavel" | "atencao" | "falha";

/** A partir de quantas falhas seguidas a fonte é considerada em falha. */
export const FALHAS_ATENCAO = 1;
export const FALHAS_FALHA = 3;

export interface SaudeFonte {
  active: boolean;
  consecutive_failures: number;
  last_error: string | null;
  last_http_status: number | null;
  last_checked_at: string | null;
  last_news_found_at: string | null;
}

/** Estado atual da fonte, derivado apenas dos dados persistidos. */
export function estadoFonte(saude: Pick<SaudeFonte, "consecutive_failures" | "last_error">): EstadoFonte {
  const falhas = Math.max(0, saude.consecutive_failures ?? 0);
  if (falhas >= FALHAS_FALHA) return "falha";
  if (falhas >= FALHAS_ATENCAO || saude.last_error) return "atencao";
  return "saudavel";
}

export const ROTULO_ESTADO: Record<EstadoFonte, string> = {
  saudavel: "Saudável",
  atencao: "Atenção",
  falha: "Falha",
};

/** Extrai o código HTTP de uma mensagem de erro no formato "HTTP 404". */
export function extrairHttpStatus(mensagem: string | null | undefined): number | null {
  if (!mensagem) return null;
  const achado = mensagem.match(/\bHTTP\s+(\d{3})\b/i);
  if (!achado?.[1]) return null;
  const status = Number.parseInt(achado[1], 10);
  return Number.isFinite(status) ? status : null;
}

export interface AtualizacaoSaude {
  last_checked_at: string;
  last_http_status: number | null;
  last_error: string | null;
  consecutive_failures: number;
  last_news_found_at?: string;
}

/** Campos a gravar quando a fonte respondeu corretamente. */
export function atualizacaoSucesso(entrada: {
  agoraIso: string;
  httpStatus?: number | null;
  encontrouNoticia: boolean;
}): AtualizacaoSaude {
  const base: AtualizacaoSaude = {
    last_checked_at: entrada.agoraIso,
    last_http_status: entrada.httpStatus ?? 200,
    last_error: null,
    consecutive_failures: 0,
  };
  if (entrada.encontrouNoticia) base.last_news_found_at = entrada.agoraIso;
  return base;
}

/** Campos a gravar quando a fonte falhou. Nunca zera o histórico de notícias. */
export function atualizacaoFalha(entrada: {
  agoraIso: string;
  mensagem: string;
  falhasAnteriores: number;
  httpStatus?: number | null;
}): AtualizacaoSaude {
  return {
    last_checked_at: entrada.agoraIso,
    last_http_status: entrada.httpStatus ?? extrairHttpStatus(entrada.mensagem),
    last_error: entrada.mensagem.slice(0, 500),
    consecutive_failures: Math.max(0, entrada.falhasAnteriores) + 1,
  };
}
