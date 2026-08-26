import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Newspaper, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/common/EmptyState";
import { NewsFilters } from "@/components/news/NewsFilters";
import { NewsList } from "@/components/news/NewsList";
import type { NewsActionHandlers } from "@/components/news/NewsActions";
import { Button } from "@/components/ui/button";
import { filtrarNoticias, filtrosIniciais } from "@/lib/newsFilter";
import { listarFontes } from "@/services/mockService";
import { alterarStatus, recarregarNoticias, useNoticias } from "@/services/newsStore";

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
  const noticias = useNoticias();
  const [filtros, setFiltros] = useState(filtrosIniciais);
  const fontes = useMemo(() => listarFontes().map((f) => f.nome), []);

  const filtradas = useMemo(() => filtrarNoticias(noticias, filtros), [noticias, filtros]);

  const handlers: NewsActionHandlers = {
    onAprovar: (n) => {
      alterarStatus(n.id, "aprovada");
      toast.success("Notícia aprovada (simulado)");
    },
    onIgnorar: (n) => {
      alterarStatus(n.id, "ignorada");
      toast.success("Notícia ignorada (simulado)");
    },
    onRejeitar: (n) => {
      alterarStatus(n.id, "rejeitada");
      toast.success("Notícia rejeitada (simulado)");
    },
    onPublicar: (n) => {
      alterarStatus(n.id, "publicada");
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
            recarregarNoticias();
            toast.success("Notícias atualizadas (dados simulados)");
          }}
        >
          <RefreshCw className="size-4" />
          Atualizar notícias
        </Button>
      }
    >
      <NewsFilters filtros={filtros} onChange={setFiltros} fontes={fontes} />

      <p className="mt-4 text-sm text-muted-foreground">
        {filtradas.length} de {noticias.length} notícia(s)
      </p>

      <div className="mt-3">
        {filtradas.length === 0 ? (
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
