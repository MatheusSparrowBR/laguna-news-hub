import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useProject } from "@/hooks/useProject";
import {
  useAlterarStatusPost,
  useEstadoInstagram,
  useLogsPublicacao,
  usePostsProjeto,
} from "@/services/editorialQueries";
import { formatarDataHora } from "@/lib/format";
import { STATUS_POST_ROTULO } from "./_admin.posts.index";

export const Route = createFileRoute("/_admin/publishing")({
  head: () => ({
    meta: [
      { title: "Fila de publicação | Notícias Laguna" },
      {
        name: "description",
        content: "Acompanhe o que está pronto, aprovado, agendado, publicado ou com falha.",
      },
      { property: "og:title", content: "Fila de publicação | Notícias Laguna" },
      {
        property: "og:description",
        content: "Controle das publicações do perfil de notícias de Laguna.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FilaPublicacaoPage,
});

const ABAS: { valor: string; rotulo: string; status: string[] }[] = [
  { valor: "prontos", rotulo: "Prontos", status: ["draft", "awaiting_approval"] },
  { valor: "aprovados", rotulo: "Aprovados", status: ["approved"] },
  { valor: "agendados", rotulo: "Agendados", status: ["scheduled", "publishing"] },
  { valor: "publicados", rotulo: "Publicados", status: ["published"] },
  { valor: "falhos", rotulo: "Falhas", status: ["failed"] },
];

function FilaPublicacaoPage() {
  const { data: projeto } = useProject();
  const projectId = projeto?.id;
  const { data: posts, isLoading } = usePostsProjeto(projectId);
  const { data: logs } = useLogsPublicacao(projectId);
  const { data: instagram } = useEstadoInstagram(projectId);
  const alterarStatus = useAlterarStatusPost(projectId);

  const [aba, setAba] = useState("prontos");
  const [novaData, setNovaData] = useState<Record<string, string>>({});

  const lista = useMemo(() => {
    const alvo = ABAS.find((a) => a.valor === aba)?.status ?? [];
    return (posts ?? []).filter((p) => alvo.includes(p.status));
  }, [posts, aba]);

  return (
    <PageContainer
      titulo="Fila de publicação"
      descricao={
        instagram?.conectado
          ? "Instagram conectado."
          : "Instagram não conectado — publicar fica disponível após a conexão."
      }
      acoes={
        <Button asChild size="sm" variant="outline">
          <Link to="/settings/integrations/instagram">Integração do Instagram</Link>
        </Button>
      }
    >
      <Tabs value={aba} onValueChange={setAba} className="mb-4">
        <TabsList className="flex-wrap">
          {ABAS.map((a) => (
            <TabsTrigger key={a.valor} value={a.valor}>
              {a.rotulo}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <LoadingState titulo="Carregando fila..." />
      ) : lista.length === 0 ? (
        <EmptyState titulo="Nada nesta situação" descricao="Escolha outra aba acima." />
      ) : (
        <div className="space-y-3">
          {lista.map((post) => (
            <Card key={post.id}>
              <CardContent className="space-y-3 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{STATUS_POST_ROTULO[post.status] ?? post.status}</Badge>
                  {post.is_sponsored ? <Badge variant="outline">PUBLICIDADE</Badge> : null}
                  {post.scheduled_at ? (
                    <span className="text-xs text-muted-foreground">
                      {formatarDataHora(post.scheduled_at)}
                    </span>
                  ) : null}
                </div>
                <h2 className="text-sm font-semibold leading-snug">
                  {post.title ?? "(sem título)"}
                </h2>

                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/posts">Editar</Link>
                  </Button>
                  <Input
                    type="datetime-local"
                    className="w-52"
                    aria-label={`Nova data para ${post.title ?? "publicação"}`}
                    value={novaData[post.id] ?? post.scheduled_at?.slice(0, 16) ?? ""}
                    onChange={(e) => setNovaData((a) => ({ ...a, [post.id]: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={alterarStatus.isPending || !novaData[post.id]}
                    onClick={() =>
                      alterarStatus.mutate({
                        id: post.id,
                        status: "scheduled",
                        scheduled_at: new Date(novaData[post.id]!).toISOString(),
                      })
                    }
                  >
                    Reagendar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={alterarStatus.isPending}
                    onClick={() => alterarStatus.mutate({ id: post.id, status: "cancelled" })}
                  >
                    Cancelar
                  </Button>
                  <Button size="sm" disabled title="Disponível quando o Instagram estiver conectado">
                    Publicar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(logs ?? []).length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold">Histórico de tentativas</h2>
          <div className="space-y-2">
            {(logs ?? []).map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2 text-xs"
              >
                <Badge variant="outline">{log.status}</Badge>
                <span className="text-muted-foreground">tentativa {log.attempt}</span>
                <span className="text-muted-foreground">{formatarDataHora(log.attempted_at)}</span>
                {log.error_message ? (
                  <span className="text-destructive">{log.error_message}</span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </PageContainer>
  );
}
