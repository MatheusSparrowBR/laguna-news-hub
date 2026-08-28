import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Newspaper, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { NewsFilters } from "@/components/news/NewsFilters";
import { NewsList } from "@/components/news/NewsList";
import type { NewsActionHandlers } from "@/components/news/NewsActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { filtrarNoticias, filtrosIniciais } from "@/lib/newsFilter";
import { useProject } from "@/hooks/useProject";
import { useNoticias, useFontes, useAlterarStatusNoticia } from "@/services/queries";
import { useModoDados } from "@/services/dataMode";

export const Route = createFileRoute("/_admin/news/")({
  head: () => ({
    meta: [
      { title: "Notícias | Projeto Notícias Laguna" },
      {
        name: "description",
        content:
          "Centro de controle editorial: filtre as notícias de Laguna, revise a análise da IA e aprove o conteúdo preparado.",
      },
      { property: "og:title", content: "Notícias | Projeto Notícias Laguna" },
      {
        property: "og:description",
        content: "Gerencie as notícias encontradas e o conteúdo preparado pela IA.",
      },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const { data: projeto } = useProject();
  const modo = useModoDados();
  const {
    data: noticias = [],
    isLoading,
    error,
    refetch,
  } = useNoticias(projeto?.id);
  const { data: fontes = [] } = useFontes(projeto?.id);
  const alterarStatus = useAlterarStatusNoticia();
  const [filtros, setFiltros] = useState(filtrosIniciais);

  const nomesFontes = useMemo(() => fontes.map((f) => f.nome), [fontes]);
  const filtradas = useMemo(() => filtrarNoticias(noticias, filtros), [noticias, filtros]);

  const handlers: NewsActionHandlers = {
    onAprovar: async (n) => {
      await alterarStatus.mutateAsync({ id: n.id, status: "aprovada" });
      toast.success("Notícia aprovada");
    },
    onIgnorar: async (n) => {
      await alterarStatus.mutateAsync({ id: n.id, status: "ignorada" });
      toast.success("Notícia ignorada");
    },
    onRejeitar: async (n) => {
      await alterarStatus.mutateAsync({ id: n.id, status: "rejeitada" });
      toast.success("Notícia rejeitada");
    },
    onPublicar: async (n) => {
      await alterarStatus.mutateAsync({ id: n.id, status: "publicada" });
      toast.success("Publicação simulada — Instagram ainda não conectado");
    },
    onCopiarLegenda: (n) => {
      navigator.clipboard?.writeText(`${n.gerado.legenda}\n\n${n.gerado.hashtags}`);
      toast.success("Legenda copiada");
    },
  };

  return (
    <PageContainer
      titulo="Notícias"
      descricao="Gerencie as notícias encontradas e o conteúdo preparado pela IA."
      acoes={
        <Button
          size="sm"
          onClick={() => {
            refetch();
            toast.success("Notícias atualizadas");
          }}
          disabled={isLoading}
        >
          <RefreshCw className="size-4" />
          Atualizar notícias
        </Button>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={modo === "banco" ? "border-green-300 text-green-700" : "border-amber-300 text-amber-700"}>
          {modo === "banco" ? "Dados reais" : "Demonstração"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {modo === "banco" ? "conectado ao banco" : "dados simulados"}
        </span>
      </div>

      <NewsFilters filtros={filtros} onChange={setFiltros} fontes={nomesFontes} />

      <p className="mt-4 text-sm text-muted-foreground">
        {filtradas.length} de {noticias.length} notícia(s)
      </p>

      <div className="mt-3">
        {isLoading ? (
          <LoadingState titulo="Carregando notícias..." />
        ) : error ? (
          <EmptyState titulo="Erro ao carregar notícias" descricao={error.message} />
        ) : filtradas.length === 0 ? (
          <EmptyState
            icone={Newspaper}
            titulo="Nenhuma notícia encontrada"
            descricao="Ajuste os filtros ou aguarde a próxima coleta das fontes."
          />
        ) : (
          <NewsList noticias={filtradas} handlers={handlers} />
        )}
      </div>
    </PageContainer>
  );
}
