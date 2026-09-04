/**
 * Retorno da autorização do Instagram (OAuth callback).
 *
 * Fica em /api/public/* porque o Instagram chama esta URL pelo navegador,
 * sem sessão do aplicativo. A segurança vem do `state`: aleatório, assinado,
 * temporário e de uso único (anti-CSRF). Sem state válido, nada é gravado.
 *
 * NUNCA registra code, token, segredo, Authorization ou cookies em log.
 */
import { createFileRoute } from "@tanstack/react-router";

function redirecionar(situacao: string, detalhe?: string): Response {
  const params = new URLSearchParams({ instagram: situacao });
  if (detalhe) params.set("motivo", detalhe);
  return new Response(null, {
    status: 302,
    headers: { Location: `/instagram?${params.toString()}` },
  });
}

export const Route = createFileRoute("/api/public/integrations/instagram/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);

        const erroOAuth = url.searchParams.get("error");
        if (erroOAuth) {
          console.error("[instagram-callback] autorização recusada");
          return redirecionar("recusado");
        }

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");

        const { consumirState } = await import("@/lib/instagram/oauthState.server");
        const validacao = await consumirState(state);
        if (!validacao.ok || !validacao.projectId) {
          console.error("[instagram-callback] state inválido:", validacao.motivo);
          return redirecionar("estado_invalido", validacao.motivo ?? undefined);
        }
        if (!code) return redirecionar("sem_autorizacao");

        try {
          const { trocarCodePorToken, trocarPorTokenLongo, obterPerfil, salvarConexao } =
            await import("@/lib/instagram/instagramOAuth.server");
          const { salvarToken } = await import("@/lib/instagram/tokenStore.server");
          const { criarClienteAdmin } = await import("@/lib/adminClient.server");
          const { INSTAGRAM_SCOPES } = await import("@/lib/instagram/instagramPublisher.server");

          const curto = await trocarCodePorToken(code);
          const longo = await trocarPorTokenLongo(curto.accessToken);
          const perfil = await obterPerfil(longo.accessToken);
          if (!perfil.ok) return redirecionar("perfil_indisponivel");

          const expiresAt = longo.expiresInSeconds
            ? new Date(Date.now() + longo.expiresInSeconds * 1000).toISOString()
            : null;

          const admin = criarClienteAdmin();
          await salvarConexao(admin, {
            projectId: validacao.projectId,
            accountId: perfil.perfil.id || curto.userId,
            username: perfil.perfil.username,
            displayName: perfil.perfil.name ?? perfil.perfil.accountType,
            scopes: INSTAGRAM_SCOPES,
            tokenExpiresAt: expiresAt,
          });
          await salvarToken({
            projectId: validacao.projectId,
            accessToken: longo.accessToken,
            expiresAt,
          });

          return redirecionar("conectado");
        } catch (erro) {
          console.error(
            "[instagram-callback] falha ao concluir conexão:",
            erro instanceof Error ? erro.message : "erro desconhecido",
          );
          return redirecionar("falha");
        }
      },
    },
  },
});
