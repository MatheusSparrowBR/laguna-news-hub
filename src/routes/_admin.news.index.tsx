import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Newspaper, Search } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { NewsCard } from "@/components/common/NewsCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listarNoticias } from "@/services/mockService";
import { CATEGORIAS } from "@/lib/types";

export const Route = createFileRoute("/_admin/news/")({
  head: () => ({
    meta: [
      { title: "Notícias | Projeto Notícias Laguna" },
      {
        name: "description",
        content:
          "Lista de notícias coletadas das fontes locais de Laguna, com categoria, importância e status de aprovação.",
      },
      { property: "og:title", content: "Notícias | Projeto Notícias Laguna" },
      {
        property: "og:description",
        content: "Notícias coletadas das fontes locais de Laguna - SC.",
      },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const noticias = listarNoticias();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [status, setStatus] = useState("todos");

  const filtradas = useMemo(
    () =>
      noticias.filter((n) => {
        const porBusca = n.titulo.toLowerCase().includes(busca.toLowerCase());
        const porCategoria = categoria === "todas" || n.categoria === categoria;
        const porStatus = status === "todos" || n.status === status;
        return porBusca && porCategoria && porStatus;
      }),
    [noticias, busca, categoria, status],
  );

  return (
    <PageContainer
      titulo="Notícias"
      descricao={`${filtradas.length} notícia(s) encontradas nas fontes cadastradas`}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título..."
            className="pl-9"
          />
        </div>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {CATEGORIAS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-52">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="nova">Nova</SelectItem>
            <SelectItem value="aguardando_aprovacao">Aguardando aprovação</SelectItem>
            <SelectItem value="aprovada">Aprovada</SelectItem>
            <SelectItem value="rejeitada">Rejeitada</SelectItem>
            <SelectItem value="publicada">Publicada</SelectItem>
            <SelectItem value="duplicada">Duplicada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        {filtradas.length === 0 ? (
          <EmptyState
            icone={Newspaper}
            titulo="Nenhuma notícia encontrada"
            descricao="Ajuste os filtros ou aguarde a próxima coleta das fontes."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filtradas.map((n) => (
              <NewsCard key={n.id} noticia={n} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
