import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PublicationCard } from "@/components/common/PublicationCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Modal } from "@/components/common/Modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { listarPublicacoes } from "@/services/mockService";
import type { Publication, PublicationStatus } from "@/lib/types";
import { formatarDataHora } from "@/lib/format";
import { NOME_DO_PERFIL } from "@/config/app";

export const Route = createFileRoute("/_admin/publications")({
  head: () => ({
    meta: [
      { title: "Publicações | Projeto Notícias Laguna" },
      {
        name: "description",
        content:
          "Acompanhe rascunhos, publicações agendadas e já publicadas do perfil de notícias de Laguna.",
      },
      { property: "og:title", content: "Publicações | Projeto Notícias Laguna" },
      {
        property: "og:description",
        content: "Fila de publicações do perfil de notícias de Laguna - SC.",
      },
    ],
  }),
  component: PublicationsPage,
});

const abas: { valor: "todas" | PublicationStatus; label: string }[] = [
  { valor: "todas", label: "Todas" },
  { valor: "rascunho", label: "Rascunhos" },
  { valor: "agendada", label: "Agendadas" },
  { valor: "publicada", label: "Publicadas" },
  { valor: "erro", label: "Com erro" },
];

function PublicationsPage() {
  const publicacoes = listarPublicacoes();
  const [selecionada, setSelecionada] = useState<Publication | null>(null);

  return (
    <PageContainer
      titulo="Publicações"
      descricao={`Fila de publicações de ${NOME_DO_PERFIL} (dados simulados)`}
    >
      <Tabs defaultValue="todas">
        <TabsList className="flex-wrap">
          {abas.map((aba) => (
            <TabsTrigger key={aba.valor} value={aba.valor}>
              {aba.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {abas.map((aba) => {
          const lista =
            aba.valor === "todas"
              ? publicacoes
              : publicacoes.filter((p) => p.status === aba.valor);
          return (
            <TabsContent key={aba.valor} value={aba.valor} className="mt-6">
              {lista.length === 0 ? (
                <EmptyState
                  icone={Send}
                  titulo="Nenhuma publicação nesta lista"
                  descricao="Aprove notícias para gerar novas publicações."
                />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {lista.map((p) => (
                    <PublicationCard
                      key={p.id}
                      publicacao={p}
                      onVisualizar={setSelecionada}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <Modal
        aberto={selecionada !== null}
        onOpenChange={(aberto) => !aberto && setSelecionada(null)}
        titulo={selecionada?.titulo ?? ""}
        descricao={
          selecionada
            ? `${formatarDataHora(selecionada.horario)} · Template: ${selecionada.template}`
            : undefined
        }
      >
        {selecionada && (
          <div className="space-y-4">
            <div className="aspect-square w-full overflow-hidden rounded-xl bg-primary p-6">
              <div className="flex h-full flex-col justify-between">
                <span className="inline-flex w-fit rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                  {selecionada.categoria}
                </span>
                <p className="font-display text-2xl font-bold leading-tight text-primary-foreground">
                  {selecionada.titulo}
                </p>
                <span className="text-xs font-medium text-primary-foreground/80">
                  {NOME_DO_PERFIL}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{selecionada.legenda}</p>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
