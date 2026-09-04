/**
 * OAuth do Instagram — SERVER-ONLY, apenas arquitetura.
 *
 * Nada é executado agora: sem conta, sem token, sem credencial fictícia.
 * As funções falham de forma explícita se a configuração não existir.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  INSTAGRAM_SCOPES,
  OAUTH_AUTHORIZE_URL,
  OAUTH_TOKEN_URL,
  obterConfigMeta,
} from "./instagramPublisher.server";

type Cliente = SupabaseClient<Database>;

export class ErroConfiguracaoMeta extends Error {
  constructor() {
    super(
      "A integração com o Instagram ainda não está configurada. Cadastre o aplicativo Meta antes de conectar.",
    );
    this.name = "ErroConfiguracaoMeta";
  }
}

/** Monta a URL de autorização. Não redireciona nem chama a rede. */
export function iniciarOAuth(state: string): string {
  const config = obterConfigMeta();
  if (!config.configurado || !config.appId || !config.redirectUri) {
    throw new ErroConfiguracaoMeta();
  }
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: INSTAGRAM_SCOPES.join(","),
    state,
  });
  return `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;
}

export interface TokenTrocado {
  accessToken: string;
  userId: string;
  expiresInSeconds: number | null;
}

/**
 * Troca o code por token. Só roda quando o usuário concluir a autorização real.
 * O token NUNCA é retornado ao navegador nem gravado em social_accounts.
 */
export async function trocarCodePorToken(code: string): Promise<TokenTrocado> {
  const config = obterConfigMeta();
  const appSecret = process.env["META_APP_SECRET"];
  if (!config.configurado || !config.appId || !config.redirectUri || !appSecret) {
    throw new ErroConfiguracaoMeta();
  }

  const resposta = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
      code,
    }),
  });

  if (!resposta.ok) {
    // Detalhe só no log do servidor; o usuário recebe mensagem amigável.
    console.error("[instagram-oauth] troca de code falhou", resposta.status);
    throw new Error("Não foi possível concluir a autorização do Instagram.");
  }

  const json = (await resposta.json()) as {
    access_token?: string;
    user_id?: string | number;
    expires_in?: number;
  };
  if (!json.access_token || !json.user_id) {
    throw new Error("A resposta da autorização do Instagram veio incompleta.");
  }
  return {
    accessToken: json.access_token,
    userId: String(json.user_id),
    expiresInSeconds: json.expires_in ?? null,
  };
}

/**
 * Registra/atualiza a conexão (sem token). Idempotente por (project_id, provider).
 */
export async function salvarConexao(
  supabase: Cliente,
  entrada: {
    projectId: string;
    accountId: string;
    username: string | null;
    displayName: string | null;
    scopes: readonly string[];
    tokenExpiresAt: string | null;
  },
): Promise<void> {
  const agora = new Date().toISOString();
  const { error } = await supabase.from("social_accounts").upsert(
    {
      project_id: entrada.projectId,
      provider: "instagram",
      account_id: entrada.accountId,
      username: entrada.username,
      display_name: entrada.displayName,
      status: "connected",
      scopes: [...entrada.scopes],
      connected_at: agora,
      last_verified_at: agora,
      token_expires_at: entrada.tokenExpiresAt,
    },
    { onConflict: "project_id,provider" },
  );
  if (error) throw new Error(`Não foi possível salvar a conexão: ${error.message}`);
}

/** Desconecta a conta: remove a conexão sem apagar posts nem histórico. */
export async function desconectar(supabase: Cliente, projectId: string): Promise<void> {
  const { error } = await supabase
    .from("social_accounts")
    .update({ status: "disconnected", account_id: null, token_expires_at: null })
    .eq("project_id", projectId)
    .eq("provider", "instagram");
  if (error) throw new Error(`Não foi possível desconectar: ${error.message}`);
}
