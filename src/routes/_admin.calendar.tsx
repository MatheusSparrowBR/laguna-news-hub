import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProject } from "@/hooks/useProject";
import { usePostsProjeto } from "@/services/editorialQueries";
import { formatarHora } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PostRegistro } from "@/services/editorialData";

export const Route = createFileRoute("/_admin/calendar")({
  head: () => ({
    meta: [
      { title: "Calendário editorial | Notícias Laguna" },
      {
        name: "description",
        content: "Veja por dia, semana ou mês as publicações agendadas e publicadas.",
      },
      { property: "og:title", content: "Calendário editorial | Notícias Laguna" },
      {
        property: "og:description",
        content: "Agenda das publicações do perfil de notícias de Laguna.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarioPage,
});

type Visao = "dia" | "semana" | "mes";

const COR_STATUS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-primary/10 text-primary",
  scheduled: "bg-primary/15 text-primary",
  publishing: "bg-warning/20 text-warning-foreground",
  published: "bg-success/15 text-success-foreground",
  failed: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground line-through",
};

function inicioDoDia(d: Date) {
  const copia = new Date(d);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function intervalo(referencia: Date, visao: Visao) {
  const inicio = inicioDoDia(referencia);
  const fim = new Date(inicio);
  if (visao === "dia") fim.setDate(fim.getDate() + 1);
  if (visao === "semana") {
    inicio.setDate(inicio.getDate() - inicio.getDay());
    fim.setTime(inicio.getTime());
    fim.setDate(fim.getDate() + 7);
  }
  if (visao === "mes") {
    inicio.setDate(1);
    fim.setTime(inicio.getTime());
    fim.setMonth(fim.getMonth() + 1);
  }
  return { inicio, fim };
}

function dataDoPost(post: PostRegistro): string | null {
  return post.published_at ?? post.scheduled_at;
}

function CalendarioPage() {
  const { data: projeto } = useProject();
  const { data: posts, isLoading } = usePostsProjeto(projeto?.id);
  const [visao, setVisao] = useState<Visao>("semana");
  const [referencia, setReferencia] = useState(() => new Date());

  const { inicio, fim } = useMemo(() => intervalo(referencia, visao), [referencia, visao]);

  const agrupado = useMemo(() => {
    const mapa = new Map<string, PostRegistro[]>();
    for (const post of posts ?? []) {
      const iso = dataDoPost(post);
      if (!iso) continue;
      const data = new Date(iso);
      if (data < inicio || data >= fim) continue;
      const chave = inicioDoDia(data).toISOString();
      mapa.set(chave, [...(mapa.get(chave) ?? []), post]);
    }
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [posts, inicio, fim]);

  const mover = (direcao: 1 | -1) => {
    const nova = new Date(referencia);
    if (visao === "dia") nova.setDate(nova.getDate() + direcao);
    if (visao === "semana") nova.setDate(nova.getDate() + 7 * direcao);
    if (visao === "mes") nova.setMonth(nova.getMonth() + direcao);
    setReferencia(nova);
  };

  const rotuloPeriodo =
    visao === "mes"
      ? referencia.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      : `${inicio.toLocaleDateString("pt-BR")} — ${new Date(fim.getTime() - 1).toLocaleDateString("pt-BR")}`;

  return (
    <PageContainer titulo="Calendário" descricao="Publicações agendadas e publicadas.">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={visao} onValueChange={(v) => setVisao(v as Visao)}>
          <TabsList>
            <TabsTrigger value="dia">Dia</TabsTrigger>
            <TabsTrigger value="semana">Semana</TabsTrigger>
            <TabsTrigger value="mes">Mês</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" aria-label="Período anterior" onClick={() => mover(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-44 text-center text-sm font-medium capitalize">{rotuloPeriodo}</span>
          <Button size="icon" variant="outline" aria-label="Próximo período" onClick={() => mover(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState titulo="Carregando agenda..." />
      ) : agrupado.length === 0 ? (
        <EmptyState
          titulo="Nada agendado neste período"
          descricao="Agende uma publicação no compositor para vê-la aqui."
        />
      ) : (
        <div className="space-y-4">
          {agrupado.map(([dia, itens]) => (
            <Card key={dia}>
              <CardContent className="space-y-2 pt-4">
                <p className="text-sm font-semibold capitalize">
                  {new Date(dia).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </p>
                {itens
                  .sort((a, b) => (dataDoPost(a) ?? "").localeCompare(dataDoPost(b) ?? ""))
                  .map((post) => (
                    <div
                      key={post.id}
                      className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2"
                    >
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatarHora(dataDoPost(post)!)}
                      </span>
                      <Badge className={cn("border-0", COR_STATUS[post.status])}>
                        {post.status}
                      </Badge>
                      {post.is_sponsored ? <Badge variant="outline">PUBLICIDADE</Badge> : null}
                      <span className="text-sm">{post.title ?? "(sem título)"}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
