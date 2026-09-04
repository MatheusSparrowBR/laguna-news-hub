/**
 * Tradução de erros do Instagram para mensagens amigáveis — puro e testável.
 *
 * Nunca expõe payload da API, token, header nem código bruto ao usuário.
 */

export type ClasseErro = "temporario" | "permanente";

export interface ErroAmigavel {
  codigo: string;
  mensagem: string;
  classe: ClasseErro;
}

const MAPA: Record<string, ErroAmigavel> = {
  not_connected: {
    codigo: "not_connected",
    mensagem: "A conta do Instagram ainda não está conectada.",
    classe: "permanente",
  },
  not_authorized: {
    codigo: "not_authorized",
    mensagem: "Esta conta do Instagram não autorizou o aplicativo.",
    classe: "permanente",
  },
  token_expired: {
    codigo: "token_expired",
    mensagem: "A autorização do Instagram expirou. Conecte a conta novamente.",
    classe: "permanente",
  },
  insufficient_permission: {
    codigo: "insufficient_permission",
    mensagem: "Faltam permissões na autorização do Instagram. Conecte novamente.",
    classe: "permanente",
  },
  asset_not_public: {
    codigo: "asset_not_public",
    mensagem: "A arte não está acessível em um endereço público para o Instagram.",
    classe: "permanente",
  },
  invalid_media: {
    codigo: "invalid_media",
    mensagem: "A arte não atende aos requisitos de mídia do Instagram.",
    classe: "permanente",
  },
  invalid_dimensions: {
    codigo: "invalid_dimensions",
    mensagem: "As dimensões da arte não são aceitas pelo Instagram.",
    classe: "permanente",
  },
  unsupported_format: {
    codigo: "unsupported_format",
    mensagem: "Formato de imagem não aceito: use JPG ou PNG.",
    classe: "permanente",
  },
  publish_in_progress: {
    codigo: "publish_in_progress",
    mensagem: "Já existe uma publicação em andamento para este conteúdo.",
    classe: "temporario",
  },
  media_rejected: {
    codigo: "media_rejected",
    mensagem: "O Instagram recusou esta publicação.",
    classe: "permanente",
  },
  rate_limited: {
    codigo: "rate_limited",
    mensagem: "O Instagram limitou as tentativas por agora. Tente mais tarde.",
    classe: "temporario",
  },
  temporary_error: {
    codigo: "temporary_error",
    mensagem: "O Instagram teve uma falha temporária. Tente novamente em alguns minutos.",
    classe: "temporario",
  },
};

/** Converte um código interno ou status HTTP em mensagem amigável. */
export function traduzirErro(codigo: string | null, statusHttp?: number): ErroAmigavel {
  if (codigo && MAPA[codigo]) return MAPA[codigo]!;
  if (statusHttp === 401 || statusHttp === 403) return MAPA["token_expired"]!;
  if (statusHttp === 429) return MAPA["rate_limited"]!;
  if (statusHttp && statusHttp >= 500) return MAPA["temporary_error"]!;
  return {
    codigo: codigo ?? "unknown_error",
    mensagem: "Não foi possível concluir a operação no Instagram.",
    classe: "temporario",
  };
}
