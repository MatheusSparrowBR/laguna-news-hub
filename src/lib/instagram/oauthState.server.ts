/**
 * Anti-CSRF do OAuth do Instagram — SERVER-ONLY.
 *
 * O `state` é aleatório, assinado (HMAC) e de uso único:
 *  - valor aleatório de 32 bytes gerado no servidor;
 *  - registrado em public.oauth_states apenas como HASH (nunca em claro);
 *  - validado no callback: assinatura, expiração, projeto e uso único.
 *
 * Nunca registra o state em log.
 */
import { createHmac, randomBytes, timingSafeEqual, createHash } from "crypto";
import { criarClienteAdmin } from "@/lib/adminClient.server";

const VALIDADE_MS = 10 * 60 * 1000;

function segredoAssinatura(): string {
  const segredo = process.env["META_APP_SECRET"] ?? process.env["LOVABLE_CRON_SECRET"];
  if (!segredo) throw new Error("Configuração ausente para assinar o pedido de conexão.");
  return segredo;
}

function base64url(entrada: Buffer): string {
  return entrada.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function assinar(valor: string): string {
  return base64url(createHmac("sha256", segredoAssinatura()).update(valor).digest());
}

export function hashState(state: string): string {
  return createHash("sha256").update(state).digest("hex");
}

/** state = <aleatório>.<assinatura>. A assinatura impede forjar valores. */
export function gerarState(): string {
  const aleatorio = base64url(randomBytes(32));
  return `${aleatorio}.${assinar(aleatorio)}`;
}

export function assinaturaValida(state: string): boolean {
  const partes = state.split(".");
  if (partes.length !== 2 || !partes[0] || !partes[1]) return false;
  const esperada = Buffer.from(assinar(partes[0]));
  const recebida = Buffer.from(partes[1]);
  if (esperada.length !== recebida.length) return false;
  return timingSafeEqual(esperada, recebida);
}

/** Registra o pedido de conexão. Guarda somente o hash do state. */
export async function registrarState(entrada: {
  projectId: string;
  userId: string | null;
  state: string;
}): Promise<void> {
  const admin = criarClienteAdmin();
  const { error } = await admin.from("oauth_states").insert({
    project_id: entrada.projectId,
    provider: "instagram",
    state_hash: hashState(entrada.state),
    created_by: entrada.userId,
    expires_at: new Date(Date.now() + VALIDADE_MS).toISOString(),
  });
  if (error) throw new Error("Não foi possível iniciar o pedido de conexão.");
}

export interface StateValidado {
  ok: boolean;
  projectId: string | null;
  motivo: string | null;
}

/**
 * Consome o state: válido apenas uma vez, dentro do prazo e com assinatura boa.
 */
export async function consumirState(state: string | null): Promise<StateValidado> {
  if (!state || !assinaturaValida(state)) {
    return { ok: false, projectId: null, motivo: "pedido de conexão inválido" };
  }
  const admin = criarClienteAdmin();
  const { data } = await admin
    .from("oauth_states")
    .select("id, project_id, expires_at, used_at")
    .eq("state_hash", hashState(state))
    .eq("provider", "instagram")
    .maybeSingle();

  if (!data) return { ok: false, projectId: null, motivo: "pedido de conexão não encontrado" };
  if (data.used_at) return { ok: false, projectId: null, motivo: "pedido de conexão já utilizado" };
  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { ok: false, projectId: null, motivo: "pedido de conexão expirado" };
  }

  const { error } = await admin
    .from("oauth_states")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id)
    .is("used_at", null);
  if (error) return { ok: false, projectId: null, motivo: "pedido de conexão já utilizado" };

  return { ok: true, projectId: data.project_id, motivo: null };
}
