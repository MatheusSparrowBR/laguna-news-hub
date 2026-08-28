import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Newspaper,
  RefreshCw,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowDownAZ,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProject } from "@/hooks/useProject";
import { useNoticias, useAlterarStatusNoticia } from "@/services/queries";
import { CATEGORIAS } from "@/lib/types";
import type { NewsItem } from "@/lib/types";

export const Route = createFileRoute("/_admin/feed")(
  {
    head: () => ({
      meta: [
        { title: "Feed | Projeto Notícias Laguna" },
        {
          name: "description",
          content:
            "Feed de notícias e gestão de posts — aprove, rejeite e copie conteúdo para Instagram.",
        },
      ],
    }),
    component: FeedPage,
  },
);

type FiltroStatus = "todos" | "pendente" | "aprovado" | "rejeitado";
type Ordenacao = "urgencia" | "data";

function statusLabel(s: FiltroStatus) {
  switch (s) {
    case "todos":
      return "Todos";
    case "pendente":
      return "Pendente";
    case "aprovado":
      return "Aprovado";
    case "rejeitado":
      return "Rejeitado";
  }
}

function mapStatusToFilter(noticia: NewsItem): FiltroStatus {
  if (noticia.status === "aprovada" || noticia.status === "publicada") return "aprovado";
  if (noticia.status === "rejeitada" || noticia.status === "ignorada") return "rejeitado";
  return "pendente";
}

function UrgencyBadge({ nota }: { nota: number }) {
  const isUrgent = nota >= 8;
  return (
    <Badge
      variant={isUrgent ? "destructive" : "secondary"}
      className={isUrgent ? "animate-pulse" : ""}
    >
      <AlertTriangle className="mr-1 size-3" />
      Urgência {nota}/10
    </Badge>
  );
}

function CopyBox({ label, value }: { label: string; value: string }) {
  if (!value) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(value);
    toast.success(`${label} copiado!`);
  };

  return (
    <div className="rounded-md border bg-muted/50 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleCopy}>
          <Copy className="mr-1 size-3" />
          Copiar
        </Button>
      </div>
      <p className="whitespace-pre-wrap text-sm text-foreground">{value}</p>
    </div>
  );
}

function FeedNewsCard({
  noticia,
  onAprovar,
  onRejeitar,
  onCopiarLegenda,
}: {
  noticia: NewsItem;
  onAprovar: () => void;
  onRejeitar: () => void;
  onCopiarLegenda: () => void;
}) {
  const statusAtual = mapStatusToFilter(noticia);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs text-muted-foreground">
              Fonte: <span className="font-medium">{noticia.fonte}</span>
            </p>
            <CardTitle className="text-base leading-tight">{noticia.titulo}</CardTitle>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <CategoryBadge categoria={noticia.categoria} />
            <UrgencyBadge nota={noticia.importanciaNota} />
            {statusAtual === "aprovado" && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                Aprovado
              </Badge>
            )}
            {statusAtual === "rejeitado" && (
              <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                Rejeitado
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Título sugerido para arte */}
        {noticia.gerado.textoArte && (
          <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Título para Arte Instagram
            </p>
            <p className="text-lg font-bold text-foreground">{noticia.gerado.textoArte}</p>
          </div>
        )}

        {/* Resumo IA */}
        {noticia.resumo && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Resumo IA:</span> {noticia.resumo}
          </div>
        )}

        {/* Caixas copiáveis */}
        <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
          <CopyBox label="Legenda sugerida" value={noticia.gerado.legenda} />
          <CopyBox label="Texto para Arte" value={noticia.gerado.textoArte} />
        </div>
        <CopyBox label="Hashtags" value={noticia.gerado.hashtags} />

        {/* Ações */}
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <Button
            size="sm"
            onClick={onAprovar}
            disabled={statusAtual === "aprovado"}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 className="mr-1 size-4" />
            Aprovar Post
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onRejeitar}
            disabled={statusAtual === "rejeitado"}
          >
            <XCircle className="mr-1 size-4" />
            Rejeitar
          </Button>
          <Button size="sm" variant="outline" onClick={onCopiarLegenda}>
            <Copy className="mr-1 size-4" />
            Copiar Legenda
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FeedPage() {
  const { data: projeto } = useProject();
  const {
    data: noticias = [],
    isLoading,
    error,
    refetch,
  } = useNoticias(projeto?.id);
  const alterarStatus = useAlterarStatusNoticia();

  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("_todas");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("urgencia");

  const filtradas = useMemo(() => {
    let resultado = [...noticias];

    // Filtro de status
    if (filtroStatus !== "todos") {
      resultado = resultado.filter((n) => mapStatusToFilter(n) === filtroStatus);
    }

    // Filtro de categoria
    if (filtroCategoria !== "_todas") {
      resultado = resultado.filter((n) => n.categoria === filtroCategoria);
    }

    // Ordenação
    if (ordenacao === "urgencia") {
      resultado.sort((a, b) => b.importanciaNota - a.importanciaNota);
    } else {
      resultado.sort(
        (a, b) => new Date(b.horario).getTime() - new Date(a.horario).getTime(),
      );
    }

    return resultado;
  }, [noticias, filtroStatus, filtroCategoria, ordenacao]);

  const handleAprovar = async (n: NewsItem) => {
    await alterarStatus.mutateAsync({ id: n.id, status: "aprovada" });
    toast.success("Post aprovado!");
  };

  const handleRejeitar = async (n: NewsItem) => {
    await alterarStatus.mutateAsync({ id: n.id, status: "rejeitada" });
    toast.success("Post rejeitado");
  };

  const handleCopiarLegenda = (n: NewsItem) => {
    const texto = `${n.gerado.legenda}\n\n${n.gerado.hashtags}`;
    navigator.clipboard?.writeText(texto);
    toast.success("Legenda copiada para a área de transferência");
  };

  return (
    <PageContainer
      titulo="Feed de Notícias"
      descricao="Gerencie posts para Instagram — aprove, rejeite e copie conteúdo pronto."
      acoes={
        <Button
          size="sm"
          onClick={() => {
            refetch();
            toast.success("Feed atualizado");
          }}
          disabled={isLoading}
        >
          <RefreshCw className="size-4" />
          Atualizar
        </Button>
      }
    >
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
        <Select
          value={filtroStatus}
          onValueChange={(v) => setFiltroStatus(v as FiltroStatus)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="rejeitado">Rejeitado</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filtroCategoria}
          onValueChange={setFiltroCategoria}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_todas">Todas</SelectItem>
            {CATEGORIAS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={ordenacao}
          onValueChange={(v) => setOrdenacao(v as Ordenacao)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="urgencia">
              <span className="flex items-center gap-1">
                <AlertTriangle className="size-3" /> Mais urgentes primeiro
              </span>
            </SelectItem>
            <SelectItem value="data">
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> Data de coleta
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        <span className="ml-auto text-sm text-muted-foreground">
          {filtradas.length} de {noticias.length} notícia(s)
        </span>
      </div>

      {/* Lista */}
      <div className="mt-4 space-y-4">
        {isLoading ? (
          <LoadingState titulo="Carregando feed..." />
        ) : error ? (
          <EmptyState titulo="Erro ao carregar" descricao={error.message} />
        ) : filtradas.length === 0 ? (
          <EmptyState
            icone={Newspaper}
            titulo="Nenhuma notícia encontrada"
            descricao="Ajuste os filtros ou aguarde novas coletas."
          />
        ) : (
          filtradas.map((n) => (
            <FeedNewsCard
              key={n.id}
              noticia={n}
              onAprovar={() => handleAprovar(n)}
              onRejeitar={() => handleRejeitar(n)}
              onCopiarLegenda={() => handleCopiarLegenda(n)}
            />
          ))
        )}
      </div>
    </PageContainer>
  );
}
