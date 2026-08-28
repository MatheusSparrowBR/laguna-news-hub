import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Newspaper, RefreshCw, Loader2 } from "lucide-react";
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
import { executarColetaDeNoticias } from "@/services/collectNews";
import { useQueryClient } from "@tanstack/react-query";
import type { NewsItem } from "@/lib/types";

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

function DemoBadge({ isDemo }: { isDemo?: boolean }) {
  if (isDemo === true) {
    return (
      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0">
        Demo
      </Badge>
    );
  }
  if (isDemo === false) {
    return (
      <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 text-[10px] px-1.5 py-0">
        Real
      </Badge>
    );
  }
  return null;
}

function NewsPage() {
  const { data: projeto } = useProject();
  const modo = useModoDados();
  const queryClient = useQueryClient();
  const {
    data: noticias = [],
    isLoading,
    error,
  } = useNoticias(projeto?.id);
  const { data: fontes = [] } = useFontes(projeto?.id);
  const alterarStatus = useAlterarStatusNoticia();
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const [coletando, setColetando] = useState(false);

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

  const handleAtualizar = async () => {
    if (!projeto?.id || coletando) return;
    setColetando(true);
    try {
      const resultado = await executarColetaDeNoticias(projeto.id);

      toast.success("Coleta concluída", {
        description: `Fontes verificadas: ${resultado.sources_checked} | Encontradas: ${resultado.total_found} | Novas: ${resultado.total_new} | Duplicadas: ${resultado.total_duplicate} | Erros: ${resultado.total_errors}`,
        duration: 8000,
      });

      // Invalidar queries relevantes
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["noticias"] }),
        queryClient.invalidateQueries({ queryKey: ["fontes"] }),
        queryClient.invalidateQueries({ queryKey: ["publicacoes"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics"] }),
        queryClient.invalidateQueries({ queryKey: ["projeto-atual"] }),
      ]);
    } catch (err: any) {
      console.error("[news] Erro na coleta:", err.message);
      toast.error(err.message ?? "Erro ao executar coleta de notícias");
    } finally {
      setColetando(false);
    }
  };

  // Contagem de reais vs demo
  const totalReais = noticias.filter((n) => (n as any).isDemo === false).length;
  const totalDemo = noticias.filter((n) => (n as any).isDemo === true).length;

  return (
    <PageContainer
      titulo="Notícias"
      descricao="Gerencie as notícias encontradas e o conteúdo preparado pela IA."
      acoes={
        <Button
          size="sm"
          onClick={handleAtualizar}
          disabled={isLoading || coletando || !projeto?.id}
        >
          {coletando ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          {coletando ? "Coletando notícias..." : "Atualizar notícias"}
        </Button>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={modo === "banco" ? "border-green-300 text-green-700" : "border-amber-300 text-amber-700"}>
          {modo === "banco" ? "Dados reais" : "Demonstração"}
        </Badge>
        {modo === "banco" && (
          <>
            <span className="text-xs text-muted-foreground">
              {totalReais} real(is) | {totalDemo} demo
            </span>
          </>
        )}
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
          <NewsListWithDemoBadge noticias={filtradas} handlers={handlers} />
        )}
      </div>
    </PageContainer>
  );
}

/** Wrapper que injeta o badge de Demo/Real em cada card */
function NewsListWithDemoBadge({
  noticias,
  handlers,
}: {
  noticias: NewsItem[];
  handlers: NewsActionHandlers;
}) {
  return <NewsList noticias={noticias} handlers={handlers} />;
}
