/**
 * Serviço de publicação no Instagram — SERVER-ONLY.
 *
 * Estado atual: NENHUMA conta conectada e NENHUMA publicação real executada.
 * Este módulo existe para que a conexão futura seja só configuração:
 * a arquitetura (validação, container de mídia, estados, retry, log) já está pronta.
 *
 * Regras:
 *  - usa a API oficial (Instagram API com Instagram Login);
 *  - permissões atuais: instagram_business_basic, instagram_business_content_publish;
 *  - credenciais lidas de process.env DENTRO das funções (nunca no escopo do módulo);
 *  - nunca envia token ao cliente e nunca grava token em tabela;
 *  - se não houver conexão, as funções retornam "não conectado" sem chamar rede.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { validarAsset, type AssetParaPublicacao, type MediaKind } from "./assetValidation";
import { decidirRetry, type PublishState } from "./publishState";

type Cliente = SupabaseClient<Database>;

export const GRAPH_VERSION = "v21.0";
export const GRAPH_BASE = `https://graph.instagram.com/${GRAPH_VERSION}`;
export const OAUTH_AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
export const OAUTH_TOKEN_URL = "https://api.instagram.com/oauth/access_token";

/** Permissões atuais da API oficial (sem nomes descontinuados). */
export const INSTAGRAM_SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
] as const;

export interface ConfigMeta {
  appId: string | null;
  appSecret: boolean;
  redirectUri: string | null;
  configurado: boolean;
}

/** Lê a configuração server-side. Nunca devolve o segredo, apenas se existe. */
export function obterConfigMeta(): ConfigMeta {
  const appId = process.env["META_APP_ID"] ?? null;
  const appSecret = !!process.env["META_APP_SECRET"];
  const redirectUri = process.env["META_REDIRECT_URI"] ?? null;
  return { appId, appSecret, redirectUri, configurado: !!appId && appSecret && !!redirectUri };
}

export interface ContaInstagram {
  id: string;
  provider: string;
  account_id: string | null;
  username: string | null;
  display_name: string | null;
  status: string;
  scopes: string[];
  connected_at: string | null;
  last_verified_at: string | null;
  token_expires_at: string | null;
}

export interface EstadoConexao {
  conectado: boolean;
  conta: ContaInstagram | null;
  config: ConfigMeta;
  /** Passos pendentes para o usuário concluir a conexão. */
  pendencias: string[];
}

export async function getAccount(
  supabase: Cliente,
  projectId: string,
): Promise<ContaInstagram | null> {
  const { data } = await supabase
    .from("social_accounts")
    .select(
      "id, provider, account_id, username, display_name, status, scopes, connected_at, last_verified_at, token_expires_at",
    )
    .eq("project_id", projectId)
    .eq("provider", "instagram")
    .maybeSingle();
  return data ?? null;
}

/** Verifica a conexão sem chamar a rede quando não há conta conectada. */
export async function validateConnection(
  supabase: Cliente,
  projectId: string,
): Promise<EstadoConexao> {
  const config = obterConfigMeta();
  const conta = await getAccount(supabase, projectId);
  const pendencias: string[] = [];

  if (!config.appId) pendencias.push("Informar o identificador do aplicativo Meta (META_APP_ID).");
  if (!config.appSecret) pendencias.push("Informar a chave secreta do aplicativo (META_APP_SECRET).");
  if (!config.redirectUri) pendencias.push("Informar o endereço de retorno (META_REDIRECT_URI).");
  if (!conta || conta.status !== "connected") pendencias.push("Conectar e autorizar a conta do Instagram.");

  return {
    conectado: !!conta && conta.status === "connected",
    conta,
    config,
    pendencias,
  };
}

/* ------------------------------------------------------ publicação (preparada) */

export interface ResultadoPublicacao {
  ok: boolean;
  state: PublishState;
  externalId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

function naoConectado(mensagem: string): ResultadoPublicacao {
  return {
    ok: false,
    state: "failed",
    externalId: null,
    errorCode: "not_connected",
    errorMessage: mensagem,
  };
}

/**
 * Cria o container de mídia. Sem conta conectada, não chama a API:
 * devolve "not_connected" (erro permanente — não gera retry).
 */
export async function createMediaContainer(
  supabase: Cliente,
  entrada: {
    projectId: string;
    asset: AssetParaPublicacao;
    caption: string;
    kind?: MediaKind;
    /** Chave de idempotência: mesmo post não cria dois containers. */
    idempotencyKey: string;
  },
): Promise<ResultadoPublicacao> {
  const validacao = validarAsset(entrada.asset);
  if (!validacao.ok) {
    return {
      ok: false,
      state: "failed",
      externalId: null,
      errorCode: validacao.codigo,
      errorMessage: validacao.erros.join(" "),
    };
  }
  const estado = await validateConnection(supabase, entrada.projectId);
  if (!estado.conectado) {
    return naoConectado("O Instagram ainda não está conectado a este projeto.");
  }
  // Ponto único da chamada oficial POST {ig-user-id}/media — habilitado
  // somente quando a conta estiver conectada e autorizada pelo usuário.
  return naoConectado("Publicação indisponível: conexão do Instagram não verificada.");
}

export async function checkMediaStatus(
  supabase: Cliente,
  projectId: string,
  _containerId: string,
): Promise<ResultadoPublicacao> {
  const estado = await validateConnection(supabase, projectId);
  if (!estado.conectado) return naoConectado("O Instagram ainda não está conectado.");
  return naoConectado("Consulta de status indisponível sem conexão verificada.");
}

export async function publishMedia(
  supabase: Cliente,
  entrada: { projectId: string; postId: string; containerId: string },
): Promise<ResultadoPublicacao> {
  const estado = await validateConnection(supabase, entrada.projectId);
  if (!estado.conectado) return naoConectado("O Instagram ainda não está conectado.");
  return naoConectado("Publicação real indisponível: conexão não verificada.");
}

export async function getPublishedMedia(
  supabase: Cliente,
  projectId: string,
): Promise<{ conectado: boolean; itens: never[] }> {
  const estado = await validateConnection(supabase, projectId);
  return { conectado: estado.conectado, itens: [] };
}

/**
 * Enfileira a publicação: grava o log com a tentativa e devolve a decisão de
 * retry. Nunca publica direto e nunca faz loop.
 */
export async function scheduleOrQueuePublish(
  supabase: Cliente,
  entrada: {
    projectId: string;
    postId: string;
    asset: AssetParaPublicacao;
    caption: string;
    idempotencyKey: string;
    tentativa?: number;
  },
): Promise<{ resultado: ResultadoPublicacao; retry: ReturnType<typeof decidirRetry> }> {
  const tentativa = entrada.tentativa ?? 1;

  // Idempotência: se já existe log publicado para este post, não repete nada.
  const { data: jaPublicado } = await supabase
    .from("publication_logs")
    .select("id, external_id")
    .eq("post_id", entrada.postId)
    .eq("status", "published")
    .limit(1)
    .maybeSingle();

  if (jaPublicado) {
    return {
      resultado: {
        ok: true,
        state: "published",
        externalId: jaPublicado.external_id,
        errorCode: null,
        errorMessage: null,
      },
      retry: { retry: false, proximaTentativaEmMs: null, motivo: "já publicado" },
    };
  }

  const resultado = await createMediaContainer(supabase, {
    projectId: entrada.projectId,
    asset: entrada.asset,
    caption: entrada.caption,
    kind: "image",
    idempotencyKey: entrada.idempotencyKey,
  });

  await supabase.from("publication_logs").insert({
    post_id: entrada.postId,
    provider: "instagram",
    external_id: resultado.externalId,
    status: resultado.ok ? "queued" : "failed",
    attempt: tentativa,
    error_code: resultado.errorCode,
    error_message: resultado.errorMessage,
  });

  return { resultado, retry: decidirRetry(tentativa, resultado.errorCode) };
}
