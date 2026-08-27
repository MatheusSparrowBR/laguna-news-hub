import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Send, Eye, Heart, MessageCircle } from "lucide-react";
import { PageContainer, SectionCard } from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listarPublicacoes } from "@/services/mockService";
import { formatarDataHora, formatarNumero } from "@/lib/format";
import type { Publication, PublicationStatus } from "@/lib/types";

export const Route = createFileRoute("/_admin/publications")({
  head: () => ({
    meta: [
      { title: "Publicações | Projeto Notícias Laguna" },
      {
        name: "description",
        content: "Gerencie as publicações do perfil de notícias de Laguna no Instagram.",
      },
    ],
  }),
  component: PublicationsPage,
});

const statusTabs: { value: "todas" | PublicationStatus; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "publicada", label: "Publicadas" },
  { value: "agendada", label: "Agendadas" },
  { value: "rascunho", label: "Rascunhos" },
  { value: "erro", label: "Erros" },
];

function PublicationsPage() {
  const publicacoes = useMemo(() => listarPublicacoes(), []);
  const [tab, setTab] = useState<string>("todas");

  const filtradas = useMemo(
    () => (tab === "todas" ? publicacoes : publicacoes.filter((p) => p.status === tab)),
    [publicacoes, tab],
  );

  return (
    <PageContainer
      titulo="Publicações"
      descricao="Gerencie as publicações no Instagram (dados simulados)."
    >
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {statusTabs.map((s) => (
            <TabsTrigger key={s.value} value={s.value}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {statusTabs.map((s) => (
          <TabsContent key={s.value} value={s.value} className="mt-4">
            {filtradas.length === 0 ? (
              <EmptyState
                icone={Send}
                titulo="Nenhuma publicação"
                descricao="Nenhuma publicação encontrada para este filtro."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtradas.map((p) => (
                  <PublicationDetailCard key={p.id} publicacao={p} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </PageContainer>
  );
}

function PublicationDetailCard({ publicacao }: { publicacao: Publication }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
            {publicacao.titulo}
          </h3>
          <StatusBadge status={publicacao.status} />
        </div>

        <div className="flex items-center gap-2">
          <CategoryBadge categoria={publicacao.categoria} />
          <span className="text-xs text-muted-foreground">
            {formatarDataHora(publicacao.horario)}
          </span>
        </div>

        <p className="line-clamp-3 text-xs text-muted-foreground">
          {publicacao.legenda}
        </p>

        {publicacao.status === "publicada" && (
          <div className="flex items-center gap-4 pt-2 border-t">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="size-3.5" />
              {formatarNumero(publicacao.visualizacoes)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="size-3.5" />
              {formatarNumero(publicacao.curtidas)}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MessageCircle className="size-3.5" />
              {publicacao.comentarios}
            </span>
          </div>
        )}

        <Button asChild variant="ghost" size="sm" className="w-full">
          <Link to="/news/$id" params={{ id: publicacao.newsId }}>
            Ver notícia original
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
