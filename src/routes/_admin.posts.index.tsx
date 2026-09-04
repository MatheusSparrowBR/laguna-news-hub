import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, PenLine } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PostComposerDialog } from "@/components/posts/PostComposerDialog";
import { useProject } from "@/hooks/useProject";
import {
  useAlterarStatusPost,
  useCampanhas,
  usePatrocinadores,
  usePostsProjeto,
  useSalvarPost,
} from "@/services/editorialQueries";
import { formatarDataHora } from "@/lib/format";
import type { PostRegistro } from "@/services/editorialData";

export const Route = createFileRoute("/_admin/posts/")({
  head: () => ({
    meta: [
      { title: "Publicações | HORA NEWS LAGUNA" },
      {
        name: "description",
        content:
          "Monte publicações de notícia ou patrocinadas com título, legenda, hashtags e arte prontos.",
      },
      { property: "og:title", content: "Publicações | HORA NEWS LAGUNA" },
      {
        property: "og:description",
        content: "Compositor de publicações do perfil de notícias de Laguna.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PostsPage,
});

export const STATUS_POST_ROTULO: Record<string, string> = {
  draft: "Rascunho",
  awaiting_approval: "Aguardando aprovação",
  approved: "Aprovada",
  scheduled: "Agendada",
  publishing: "Publicando",
  published: "Publicada",
  failed: "Falhou",
  cancelled: "Cancelada",
};

function PostsPage() {
  const { data: projeto } = useProject();
  const projectId = projeto?.id;
  const { data: posts, isLoading } = usePostsProjeto(projectId);
  const { data: patrocinadores } = usePatrocinadores(projectId);
  const { data: campanhas } = useCampanhas(projectId);
  const salvarPost = useSalvarPost(projectId);
  const alterarStatus = useAlterarStatusPost(projectId);

  const [compositorAberto, setCompositorAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<PostRegistro | null>(null);

  const abrirNovo = () => {
    setEmEdicao(null);
    setCompositorAberto(true);
  };

  return (
    <PageContainer
      titulo="Publicações"
      descricao="Publicações de notícia e conteúdos patrocinados, separados de forma clara."
      acoes={
        <Button size="sm" onClick={abrirNovo}>
          <Plus className="size-4" />
          Nova publicação
        </Button>
      }
    >
      {isLoading ? (
        <LoadingState titulo="Carregando publicações..." />
      ) : (posts ?? []).length === 0 ? (
        <EmptyState
          titulo="Nenhuma publicação criada"
          descricao="Crie a primeira a partir de uma notícia aprovada ou de uma campanha."
        />
      ) : (
        <div className="space-y-3">
          {(posts ?? []).map((post) => (
            <Card key={post.id}>
              <CardContent className="space-y-2 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={post.is_sponsored ? "outline" : "secondary"}>
                    {post.is_sponsored ? "PUBLICIDADE" : "Notícia"}
                  </Badge>
                  <Badge variant="outline">
                    {STATUS_POST_ROTULO[post.status] ?? post.status}
                  </Badge>
                  {post.scheduled_at ? (
                    <span className="text-xs text-muted-foreground">
                      agendada para {formatarDataHora(post.scheduled_at)}
                    </span>
                  ) : null}
                </div>
                <h2 className="text-sm font-semibold leading-snug">
                  {post.title ?? "(sem título)"}
                </h2>
                {post.caption ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{post.caption}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEmEdicao(post);
                      setCompositorAberto(true);
                    }}
                  >
                    <PenLine className="size-4" />
                    Editar
                  </Button>
                  {post.status !== "cancelled" && post.status !== "published" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={alterarStatus.isPending}
                      onClick={() => alterarStatus.mutate({ id: post.id, status: "cancelled" })}
                    >
                      Cancelar
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {compositorAberto && projectId ? (
        <PostComposerDialog
          key={emEdicao?.id ?? "novo"}
          aberto
          onOpenChange={(v) => {
            if (!v) {
              setCompositorAberto(false);
              setEmEdicao(null);
            }
          }}
          projectId={projectId}
          post={emEdicao}
          patrocinadores={patrocinadores ?? []}
          campanhas={campanhas ?? []}
          salvando={salvarPost.isPending}
          onSalvar={(entrada) =>
            salvarPost.mutate(entrada, {
              onSuccess: () => {
                setCompositorAberto(false);
                setEmEdicao(null);
              },
            })
          }
        />
      ) : null}
    </PageContainer>
  );
}
