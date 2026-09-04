import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analyzeAuthMiddleware } from "@/integrations/supabase/analyze-auth-middleware";

/**
 * Server Functions da integração com o Instagram.
 *
 * Regras invioláveis:
 *  - o token NUNCA volta ao navegador;
 *  - nada é publicado automaticamente: só a ação manual "Publicar agora";
 *  - a conexão só começa quando o usuário clica em "Conectar Instagram".
 */

const projeto = z.object({ project_id: z.string().uuid() });

/** Passo 1 do OAuth: gera o pedido de conexão e devolve a URL de autorização. */
export const iniciarConexaoInstagram = createServerFn({ method: "POST" })
  .middleware([analyzeAuthMiddleware])
  .inputValidator((input) => projeto.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // RLS garante que só o dono do projeto enxerga a linha.
    const { data: dono } = await supabase
      .from("projects")
      .select("id")
      .eq("id", data.project_id)
      .maybeSingle();
    if (!dono) throw new Error("Projeto não encontrado.");

    const { iniciarOAuth } = await import("@/lib/instagram/instagramOAuth.server");
    const { gerarState, registrarState } = await import("@/lib/instagram/oauthState.server");

    const state = gerarState();
    const url = iniciarOAuth(state);
    await registrarState({ projectId: data.project_id, userId, state });

    const { registrarAuditoria } = await import("@/lib/audit.server");
    await registrarAuditoria(supabase, {
      projectId: data.project_id,
      actorId: userId,
      action: "instagram_connect",
      entityType: "social_account",
      details: { etapa: "autorizacao_iniciada" },
    });

    return { url };
  });

/** Confere se a autorização continua válida e atualiza a situação da conta. */
export const verificarConexaoInstagram = createServerFn({ method: "POST" })
  .middleware([analyzeAuthMiddleware])
  .inputValidator((input) => projeto.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { getAccount } = await import("@/lib/instagram/instagramPublisher.server");
    const conta = await getAccount(supabase, data.project_id);
    if (!conta) {
      return { status: "disconnected", username: null, accountType: null, mensagem: "Conta não conectada." };
    }

    const { obterToken } = await import("@/lib/instagram/tokenStore.server");
    const credencial = await obterToken(data.project_id);
    if (!credencial) {
      await supabase
        .from("social_accounts")
        .update({ status: "disconnected", last_verified_at: new Date().toISOString() })
        .eq("id", conta.id);
      return {
        status: "disconnected",
        username: conta.username,
        accountType: null,
        mensagem: "A autorização não está mais guardada. Conecte a conta novamente.",
      };
    }

    const { obterPerfil } = await import("@/lib/instagram/instagramOAuth.server");
    const perfil = await obterPerfil(credencial.accessToken);
    const agora = new Date().toISOString();

    if (!perfil.ok) {
      const { traduzirErro } = await import("@/lib/instagram/errorMap");
      const amigavel = traduzirErro(null, perfil.status);
      await supabase
        .from("social_accounts")
        .update({ status: perfil.status === 401 || perfil.status === 403 ? "expired" : "error", last_verified_at: agora })
        .eq("id", conta.id);
      return {
        status: perfil.status === 401 || perfil.status === 403 ? "expired" : "error",
        username: conta.username,
        accountType: null,
        mensagem: amigavel.mensagem,
      };
    }

    await supabase
      .from("social_accounts")
      .update({
        status: "connected",
        username: perfil.perfil.username ?? conta.username,
        display_name: perfil.perfil.name ?? conta.display_name,
        last_verified_at: agora,
      })
      .eq("id", conta.id);

    return {
      status: "connected",
      username: perfil.perfil.username,
      accountType: perfil.perfil.accountType,
      mensagem: "Conexão verificada.",
    };
  });

/**
 * Publicação MANUAL. Só executa quando o usuário clica em "Publicar agora"
 * e apenas para post aprovado com arte válida.
 */
export const publicarAgora = createServerFn({ method: "POST" })
  .middleware([analyzeAuthMiddleware])
  .inputValidator((input) => projeto.extend({ post_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: post } = await supabase
      .from("posts")
      .select("id, project_id, status, caption, hashtags, image_url")
      .eq("id", data.post_id)
      .maybeSingle();

    if (!post || post.project_id !== data.project_id) {
      throw new Error("Publicação não encontrada neste projeto.");
    }
    if (post.status === "published") {
      return { ok: true, status: "published", mensagem: "Esta publicação já foi publicada." };
    }
    if (post.status !== "approved" && post.status !== "scheduled" && post.status !== "queued") {
      throw new Error("Só é possível publicar um conteúdo aprovado.");
    }

    const { validateConnection, publicarPostAgora } = await import(
      "@/lib/instagram/instagramPublisher.server"
    );
    const estado = await validateConnection(supabase, data.project_id);
    if (!estado.conectado) throw new Error("Conecte o Instagram antes de publicar.");

    const { resolverAssetDoPost } = await import("@/lib/instagram/assetUrl.server");
    const asset = await resolverAssetDoPost({ postId: post.id, imageUrl: post.image_url });
    if (!asset.ok) throw new Error(asset.erro ?? "A arte não está pronta para publicação.");

    const legenda = [post.caption ?? "", post.hashtags ?? ""].join("\n\n").trim();
    if (!legenda) throw new Error("A legenda está vazia.");

    await supabase.from("posts").update({ status: "publishing" }).eq("id", post.id);

    const { resultado } = await publicarPostAgora(supabase, {
      projectId: data.project_id,
      postId: post.id,
      asset: {
        publicUrl: asset.publicUrl,
        mimeType: asset.mimeType,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
      },
      caption: legenda,
      idempotencyKey: `${post.id}:instagram`,
    });

    const publicado = resultado.ok && resultado.state === "published";
    await supabase
      .from("posts")
      .update({
        status: publicado ? "published" : "failed",
        published_at: publicado ? new Date().toISOString() : null,
        external_post_id: resultado.externalId,
      })
      .eq("id", post.id);

    const { registrarAuditoria } = await import("@/lib/audit.server");
    await registrarAuditoria(supabase, {
      projectId: data.project_id,
      actorId: userId,
      action: "post_publish",
      entityType: "post",
      entityId: post.id,
      details: { resultado: publicado ? "published" : "failed", motivo: resultado.errorCode },
    });

    if (!publicado) throw new Error(resultado.errorMessage ?? "A publicação não foi concluída.");
    return { ok: true, status: "published", mensagem: "Publicado no Instagram." };
  });
