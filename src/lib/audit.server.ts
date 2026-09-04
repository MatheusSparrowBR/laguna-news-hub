/**
 * Auditoria e notificações internas (server-only).
 *
 * NUNCA registra token, senha, secret ou API key: apenas identificadores,
 * ação e detalhes de domínio.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Cliente = SupabaseClient<Database>;

export type AcaoAuditavel =
  | "geo_override"
  | "editorial_approve"
  | "editorial_reject"
  | "editorial_review"
  | "post_create"
  | "post_update"
  | "post_schedule"
  | "post_cancel"
  | "post_publish"
  | "sponsor_create"
  | "sponsor_update"
  | "campaign_create"
  | "campaign_update"
  | "deliverable_create"
  | "deliverable_update"
  | "instagram_connect"
  | "instagram_disconnect";

/** Chaves proibidas em `details` — removidas antes de gravar. */
const CHAVES_PROIBIDAS = /(token|secret|password|senha|api[_-]?key|authorization|cookie)/i;

export function sanitizarDetalhes(
  detalhes: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!detalhes) return {};
  const saida: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(detalhes)) {
    if (CHAVES_PROIBIDAS.test(chave)) continue;
    saida[chave] = typeof valor === "string" ? valor.slice(0, 500) : valor;
  }
  return saida;
}

export async function registrarAuditoria(
  supabase: Cliente,
  entrada: {
    projectId: string;
    actorId: string | null;
    action: AcaoAuditavel;
    entityType: string;
    entityId?: string | null;
    details?: Record<string, unknown>;
  },
): Promise<void> {
  const { error } = await supabase.from("audit_logs").insert({
    project_id: entrada.projectId,
    actor_id: entrada.actorId,
    action: entrada.action,
    entity_type: entrada.entityType,
    entity_id: entrada.entityId ?? null,
    details: sanitizarDetalhes(entrada.details) as never,
  });
  if (error) console.error("[audit] falha ao registrar", error.message);
}

export type TipoNotificacao =
  | "news_uncertain"
  | "news_outside_review"
  | "news_high_importance"
  | "campaign_ending"
  | "sponsored_post_pending"
  | "publication_failed"
  | "instagram_disconnected"
  | "source_failing";


export async function criarNotificacao(
  supabase: Cliente,
  entrada: {
    projectId: string;
    kind: TipoNotificacao;
    title: string;
    message?: string | null;
    newsId?: string | null;
    postId?: string | null;
    campaignId?: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    project_id: entrada.projectId,
    kind: entrada.kind,
    title: entrada.title,
    message: entrada.message ?? null,
    news_id: entrada.newsId ?? null,
    post_id: entrada.postId ?? null,
    campaign_id: entrada.campaignId ?? null,
  });
  if (error) console.error("[notification] falha ao criar", error.message);
}
