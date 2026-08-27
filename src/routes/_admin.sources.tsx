import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Globe, Rss, Share2, Plus } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { listarFontes } from "@/services/mockService";
import { formatarDataHora } from "@/lib/format";
import type { Source } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/sources")({
  head: () => ({
    meta: [
      { title: "Fontes | Projeto Notícias Laguna" },
      {
        name: "description",
        content: "Gerencie as fontes de notícias monitoradas pelo sistema.",
      },
    ],
  }),
  component: SourcesPage,
});

const tipoIcone = {
  site: Globe,
  rss: Rss,
  rede_social: Share2,
} as const;

const tipoLabel = {
  site: "Site",
  rss: "RSS",
  rede_social: "Rede social",
} as const;

function SourcesPage() {
  const fontes = useMemo(() => listarFontes(), []);

  return (
    <PageContainer
      titulo="Fontes"
      descricao="Fontes de notícias monitoradas pelo sistema (dados simulados)."
      acoes={
        <Button
          size="sm"
          onClick={() => toast.info("Cadastro de fontes será implementado em breve.")}
        >
          <Plus className="size-4" />
          Adicionar fonte
        </Button>
      }
    >
      {fontes.length === 0 ? (
        <EmptyState
          icone={Rss}
          titulo="Nenhuma fonte cadastrada"
          descricao="Adicione uma fonte para começar a monitorar notícias."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {fontes.map((fonte) => (
            <SourceCard key={fonte.id} fonte={fonte} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function SourceCard({ fonte }: { fonte: Source }) {
  const Icone = tipoIcone[fonte.tipo];

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icone className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">{fonte.nome}</h3>
          </div>
          <Switch
            checked={fonte.ativa}
            onCheckedChange={() =>
              toast.info("Alteração de status simulada — será implementada com o Supabase.")
            }
            aria-label={`Ativar/desativar ${fonte.nome}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={fonte.ativa ? "default" : "secondary"}>
            {fonte.ativa ? "Ativa" : "Inativa"}
          </Badge>
          <Badge variant="outline">{tipoLabel[fonte.tipo]}</Badge>
        </div>

        <a
          href={fonte.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-xs text-primary hover:underline"
        >
          {fonte.url}
        </a>

        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>{fonte.noticiasColetadas} notícias coletadas</span>
          <span>Última: {formatarDataHora(fonte.ultimaColeta)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
