import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/**
 * Endpoint da coleta automática (chamado pelo pg_cron via pg_net).
 * Autenticação server-to-server pelo segredo LOVABLE_CRON_SECRET.
 * Nenhum JWT de usuário e nenhuma chamada anônima são aceitos.
 */
export const Route = createFileRoute("/api/public/hooks/collect-news")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const naoAutorizado = await authenticateCronRequest(request);
        if (naoAutorizado) return naoAutorizado;

        try {
          const { criarClienteAdmin } = await import("@/lib/adminClient.server");
          const { executarColeta } = await import("@/lib/collectNews.server");
          const supabaseAdmin = criarClienteAdmin();


          const { data: projeto, error: erroProjeto } = await supabaseAdmin
            .from("projects")
            .select("id")
            .eq("active", true)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (erroProjeto) throw new Error(`Erro ao obter projeto: ${erroProjeto.message}`);
          if (!projeto) {
            return Response.json({ ok: false, error: "Nenhum projeto ativo encontrado" }, { status: 404 });
          }

          const resultado = await executarColeta({
            supabase: supabaseAdmin,
            projectId: projeto.id,
            origem: "cron",
          });

          return Response.json({ ok: true, ...resultado });
        } catch (erro) {
          const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido";
          console.error("[collect-news] cron_error", mensagem);
          return Response.json({ ok: false, error: mensagem }, { status: 500 });
        }
      },
    },
  },
});
