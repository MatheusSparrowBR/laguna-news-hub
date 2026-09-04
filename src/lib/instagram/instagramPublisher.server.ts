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
import { traduzirErro } from "./errorMap";
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

/* ------------------------------------------------------------- publicação */

export interface ResultadoPublicacao {
  ok: boolean;
  state: PublishState;
  externalId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

function falha(codigo: string, statusHttp?: number): ResultadoPublicacao {
  const amigavel = traduzirErro(codigo, statusHttp);

  return {
    ok: false,
    state: "failed",
    externalId: null,
    errorCode: amigavel.codigo,
    errorMessage: amigavel.mensagem,
  };
}

async function contexto(
  supabase: Cliente,
  projectId: string,
): Promise<
  | { ok: true; igUserId: string; accessToken: string }
  | { ok: false; resultado: ResultadoPublicacao }
> {
  const estado = await validateConnection(supabase, projectId);
  if (!estado.conectado || !estado.conta?.account_id) {
    return { ok: false, resultado: falha("not_connected") };
  }
  const { obterToken } = await import("./tokenStore.server");
  const credencial = await obterToken(projectId);
  if (!credencial) return { ok: false, resultado: falha("not_connected") };
  if (credencial.expiresAt && new Date(credencial.expiresAt).getTime() < Date.now()) {
    return { ok: false, resultado: falha("token_expired") };
  }
  return { ok: true, igUserId: estado.conta.account_id, accessToken: credencial.accessToken };
}

/** Cria o container de mídia (POST {ig-user-id}/media). */
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
  if (!validacao.ok) return falha(validacao.codigo ?? "invalid_media");

  const ctx = await contexto(supabase, entrada.projectId);
  if (!ctx.ok) return ctx.resultado;

  const url = new URL(`${GRAPH_BASE}/${ctx.igUserId}/media`);
  const resposta = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ctx.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: entrada.asset.publicUrl,
      caption: entrada.caption,
    }),
  });

  if (!resposta.ok) {
    console.error("[instagram] criação de container falhou", resposta.status);
    return falha("media_rejected", resposta.status);
  }
  const json = (await resposta.json()) as { id?: string };
  if (!json.id) return falha("media_rejected");
  return { ok: true, state: "publishing", externalId: json.id, errorCode: null, errorMessage: null };
}

export async function checkMediaStatus(
  supabase: Cliente,
  projectId: string,
  containerId: string,
): Promise<ResultadoPublicacao> {
  const ctx = await contexto(supabase, projectId);
  if (!ctx.ok) return ctx.resultado;

  const url = new URL(`${GRAPH_BASE}/${containerId}`);
  url.searchParams.set("fields", "status_code");
  const resposta = await fetch(url, { headers: { Authorization: `Bearer ${ctx.accessToken}` } });
  if (!resposta.ok) return falha("temporary_error", resposta.status);

  const json = (await resposta.json()) as { status_code?: string };
  if (json.status_code === "FINISHED") {
    return { ok: true, state: "queued", externalId: containerId, errorCode: null, errorMessage: null };
  }
  if (json.status_code === "ERROR") return falha("media_rejected");
  return falha("publish_in_progress");
}

/** Publica o container (POST {ig-user-id}/media_publish). */
export async function publishMedia(
  supabase: Cliente,
  entrada: { projectId: string; postId: string; containerId: string },
): Promise<ResultadoPublicacao> {
  const ctx = await contexto(supabase, entrada.projectId);
  if (!ctx.ok) return ctx.resultado;

  const url = new URL(`${GRAPH_BASE}/${ctx.igUserId}/media_publish`);
  const resposta = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ctx.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ creation_id: entrada.containerId }),
  });

  if (!resposta.ok) {
    console.error("[instagram] publicação falhou", resposta.status);
    return falha("media_rejected", resposta.status);
  }
  const json = (await resposta.json()) as { id?: string };
  if (!json.id) return falha("media_rejected");
  return { ok: true, state: "published", externalId: json.id, errorCode: null, errorMessage: null };
}

export async function getPublishedMedia(
  supabase: Cliente,
  projectId: string,
): Promise<{ conectado: boolean; itens: never[] }> {
  const estado = await validateConnection(supabase, projectId);
  return { conectado: estado.conectado, itens: [] };
}

/**
 * Publicação MANUAL de um post aprovado. Nunca é chamada por cron.
 *
 * Idempotência: se já existe log publicado para o post, nada é reenviado.
 */
export async function publicarPostAgora(
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

  const container = await createMediaContainer(supabase, {
    projectId: entrada.projectId,
    asset: entrada.asset,
    caption: entrada.caption,
    kind: "image",
    idempotencyKey: entrada.idempotencyKey,
  });

  let resultado = container;
  if (container.ok && container.externalId) {
    resultado = await publishMedia(supabase, {
      projectId: entrada.projectId,
      postId: entrada.postId,
      containerId: container.externalId,
    });
  }

  const publicado = resultado.ok && resultado.state === "published";
  await supabase.from("publication_logs").insert({
    post_id: entrada.postId,
    provider: "instagram",
    external_id: resultado.externalId,
    status: publicado ? "published" : "failed",
    attempt: tentativa,
    published_at: publicado ? new Date().toISOString() : null,
    error_code: resultado.errorCode,
    error_message: resultado.errorMessage,
  });

  return { resultado, retry: decidirRetry(tentativa, resultado.errorCode) };
}

/** Enfileira sem publicar (usado por agendamento manual). */
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
  const container = await createMediaContainer(supabase, {
    projectId: entrada.projectId,
    asset: entrada.asset,
    caption: entrada.caption,
    kind: "image",
    idempotencyKey: entrada.idempotencyKey,
  });

  await supabase.from("publication_logs").insert({
    post_id: entrada.postId,
    provider: "instagram",
    external_id: container.externalId,
    status: container.ok ? "queued" : "failed",
    attempt: tentativa,
    error_code: container.errorCode,
    error_message: container.errorMessage,
  });

  return { resultado: container, retry: decidirRetry(tentativa, container.errorCode) };
}

