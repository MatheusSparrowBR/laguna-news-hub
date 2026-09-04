import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/**
 * Endpoint da coleta automática (chamado pelo pg_cron via pg_net).
 * Autenticação server-to-server pelo segredo LOVABLE_CRON_SECRET.
 * Nenhum JWT de usuário e nenhuma chamada anônima são aceitos.
 *
 * A execução processa cada projeto ativo isoladamente; nunca escolhe
 * silenciosamente "o primeiro projeto" quando existir mais de um tenant.
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

          const { data: projetos, error: erroProjetos } = await supabaseAdmin
            .from("projects")
            .select("id")
            .eq("active", true)
            .order("created_at", { ascending: true });

          if (erroProjetos) {
            throw new Error(`Erro ao obter projetos ativos: ${erroProjetos.message}`);
          }

          if (!projetos?.length) {
            return Response.json(
              { ok: true, projects_checked: 0, results: [] },
              { status: 200 },
            );
          }

          const results: Array<Record<string, unknown>> = [];
          let hasFailure = false;

          for (const projeto of projetos) {
            try {
              const resultado = await executarColeta({
                supabase: supabaseAdmin,
                projectId: projeto.id,
                origem: "cron",
              });
              results.push({ project_id: projeto.id, ok: true, ...resultado });
            } catch (erro) {
              hasFailure = true;
              const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido";
              console.error("[collect-news] project_error", projeto.id, mensagem);
              results.push({ project_id: projeto.id, ok: false, error: mensagem });
            }
          }

          return Response.json(
            {
              ok: !hasFailure,
              projects_checked: projetos.length,
              results,
            },
            { status: hasFailure ? 207 : 200 },
          );
        } catch (erro) {
          const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido";
          console.error("[collect-news] cron_error", mensagem);
          return Response.json({ ok: false, error: mensagem }, { status: 500 });
        }
      },
    },
  },
});
