import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analyzeAuthMiddleware } from "@/integrations/supabase/analyze-auth-middleware";

/**
 * Server Functions do fluxo editorial.
 *
 * - override geográfico (mantém a decisão automática intacta)
 * - decisão editorial (aprovar / rejeitar / enviar para revisão)
 * - estado da integração com o Instagram (somente leitura)
 *
 * Nunca chama IA, nunca publica, nunca altera notícias em massa.
 */

const decisaoGeografica = z.enum(["local", "outside", "uncertain"]);

export const salvarOverrideGeografico = createServerFn({ method: "POST" })
  .middleware([analyzeAuthMiddleware])
  .inputValidator((input) =>
    z
      .object({
        project_id: z.string().uuid(),
        news_id: z.string().uuid(),
        manual_decision: decisaoGeografica,
        review_notes: z.string().max(1000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: noticia, error: erroNoticia } = await supabase
      .from("news")
      .select("id, title, project_id, projects(owner_id)")
      .eq("id", data.news_id)
      .maybeSingle();

    if (erroNoticia) throw new Error("Não foi possível carregar a notícia.");
    if (!noticia || noticia.project_id !== data.project_id) {
      throw new Error("Notícia não encontrada neste projeto.");
    }

    const { data: atual } = await supabase
      .from("news_geography")
      .select("id, decision, manual_decision")
      .eq("news_id", data.news_id)
      .maybeSingle();

    const agora = new Date().toISOString();
    const { houveMudancaGeo } = await import("@/lib/rules/editorialAudit");
    const mudou = houveMudancaGeo(
      atual?.manual_decision as "local" | "outside" | "uncertain" | null,
      atual?.decision as "local" | "outside" | "uncertain" | null,
      data.manual_decision,
    );

    if (atual) {
      // A decisão automática (decision) NUNCA é sobrescrita.
      const { error } = await supabase
        .from("news_geography")
        .update({
          manual_decision: data.manual_decision,
          review_notes: data.review_notes ?? null,
          review_status: "reviewed",
          reviewed_by: userId,
          reviewed_at: agora,
        })
        .eq("id", atual.id);
      if (error) throw new Error("Não foi possível salvar a revisão geográfica.");
    } else {
      const { error } = await supabase.from("news_geography").insert({
        news_id: data.news_id,
        decision: data.manual_decision,
        score: 0,
        reason: "registro criado manualmente na revisão editorial",
        source_mode: "shadow",
        manual_decision: data.manual_decision,
        review_notes: data.review_notes ?? null,
        review_status: "reviewed",
        reviewed_by: userId,
        reviewed_at: agora,
      });
      if (error) throw new Error("Não foi possível salvar a revisão geográfica.");
    }

    // Auditoria somente quando a decisão vigente mudou de fato.
    if (mudou) {
      const { registrarAuditoria } = await import("@/lib/audit.server");
      await registrarAuditoria(supabase, {
        projectId: data.project_id,
        actorId: userId,
        action: "geo_override",
        entityType: "news",
        entityId: data.news_id,
        details: {
          automatic_decision: atual?.decision ?? null,
          previous_manual_decision: atual?.manual_decision ?? null,
          manual_decision: data.manual_decision,
          review_notes: data.review_notes ?? null,
        },
      });
    }

    return {
      ok: true,
      mudou,
      automatic_decision: atual?.decision ?? null,
      manual_decision: data.manual_decision,
    };
  });


export const salvarDecisaoEditorial = createServerFn({ method: "POST" })
  .middleware([analyzeAuthMiddleware])
  .inputValidator((input) =>
    z
      .object({
        project_id: z.string().uuid(),
        news_id: z.string().uuid(),
        decision: z.enum(["approved", "rejected", "review_required", "archived"]),
        note: z.string().max(1000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: noticia } = await supabase
      .from("news")
      .select("id, project_id, status")
      .eq("id", data.news_id)
      .maybeSingle();

    if (!noticia || noticia.project_id !== data.project_id) {
      throw new Error("Notícia não encontrada neste projeto.");
    }

    // Idempotente: repetir a mesma decisão não gera efeito adicional.
    if (noticia.status !== data.decision) {
      const { error } = await supabase
        .from("news")
        .update({ status: data.decision })
        .eq("id", data.news_id);
      if (error) throw new Error("Não foi possível salvar a decisão editorial.");
    }

    const acao =
      data.decision === "approved"
        ? "editorial_approve"
        : data.decision === "rejected"
          ? "editorial_reject"
          : "editorial_review";

    const { registrarAuditoria } = await import("@/lib/audit.server");
    await registrarAuditoria(supabase, {
      projectId: data.project_id,
      actorId: userId,
      action: acao,
      entityType: "news",
      entityId: data.news_id,
      details: { de: noticia.status, para: data.decision, nota: data.note ?? null },
    });

    return { ok: true, status: data.decision };
  });

export const obterEstadoInstagram = createServerFn({ method: "POST" })
  .middleware([analyzeAuthMiddleware])
  .inputValidator((input) => z.object({ project_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { validateConnection } = await import("@/lib/instagram/instagramPublisher.server");
    const estado = await validateConnection(supabase, data.project_id);
    // Nunca devolve token nem segredo: apenas se a configuração existe.
    return {
      conectado: estado.conectado,
      pendencias: estado.pendencias,
      configurado: estado.config.configurado,
      username: estado.conta?.username ?? null,
      status: estado.conta?.status ?? "disconnected",
      scopes: estado.conta?.scopes ?? [],
      connected_at: estado.conta?.connected_at ?? null,
    };
  });

export const desconectarInstagram = createServerFn({ method: "POST" })
  .middleware([analyzeAuthMiddleware])
  .inputValidator((input) => z.object({ project_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { desconectar } = await import("@/lib/instagram/instagramOAuth.server");
    await desconectar(supabase, data.project_id);
    const { registrarAuditoria } = await import("@/lib/audit.server");
    await registrarAuditoria(supabase, {
      projectId: data.project_id,
      actorId: userId,
      action: "instagram_disconnect",
      entityType: "social_account",
    });
    return { ok: true };
  });
