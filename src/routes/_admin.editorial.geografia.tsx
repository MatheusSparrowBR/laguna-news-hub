import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { MetricCard } from "@/components/common/MetricCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeoBadge } from "@/components/editorial/GeoBadge";
import { GeoReviewDialog } from "@/components/editorial/GeoReviewDialog";
import { useProject } from "@/hooks/useProject";
import { useFilaEditorial, useOverrideGeografico } from "@/services/editorialQueries";
import { GEOGRAPHIC_FILTER_MODE } from "@/lib/rules/geoFilterMode";
import { formatarDataHora } from "@/lib/format";
import { MapPin, HelpCircle, Ban } from "lucide-react";
import type { NoticiaEditorial } from "@/services/editorialData";

export const Route = createFileRoute("/_admin/editorial/geografia")({
  head: () => ({
    meta: [
      { title: "Revisão geográfica | Notícias Laguna" },
      {
        name: "description",
        content:
          "Confira e corrija se cada notícia é de Laguna, com as evidências usadas pela análise automática.",
      },
      { property: "og:title", content: "Revisão geográfica | Notícias Laguna" },
      {
        property: "og:description",
        content: "Decisão automática e correção manual do filtro de Laguna.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RevisaoGeograficaPage,
});

const MODO_ROTULO: Record<string, string> = {
  shadow: "Observação (nada é bloqueado)",
  review: "Revisão (fora de Laguna vai para a fila)",
  block_outside: "Bloqueio de notícias de fora",
};

function decisaoVigente(n: NoticiaEditorial) {
  return n.geo ? (n.geo.manual_decision ?? n.geo.decision) : null;
}

function RevisaoGeograficaPage() {
  const { data: projeto } = useProject();
  const projectId = projeto?.id;
  const { data: noticias, isLoading } = useFilaEditorial(projectId);
  const override = useOverrideGeografico(projectId);

  const [aba, setAba] = useState("uncertain");
  const [emRevisao, setEmRevisao] = useState<NoticiaEditorial | null>(null);

  const comAnalise = useMemo(() => (noticias ?? []).filter((n) => n.geo), [noticias]);
  const contagem = useMemo(
    () => ({
      local: comAnalise.filter((n) => decisaoVigente(n) === "local").length,
      uncertain: comAnalise.filter((n) => decisaoVigente(n) === "uncertain").length,
      outside: comAnalise.filter((n) => decisaoVigente(n) === "outside").length,
    }),
    [comAnalise],
  );

  const lista = comAnalise.filter((n) => decisaoVigente(n) === aba);

  return (
    <PageContainer
      titulo="Revisão geográfica"
      descricao={`Modo atual: ${MODO_ROTULO[GEOGRAPHIC_FILTER_MODE] ?? GEOGRAPHIC_FILTER_MODE}`}
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <MetricCard titulo="É de Laguna" valor={contagem.local} icone={MapPin} />
        <MetricCard titulo="Incertas" valor={contagem.uncertain} icone={HelpCircle} />
        <MetricCard titulo="Fora de Laguna" valor={contagem.outside} icone={Ban} />
      </div>

      <Tabs value={aba} onValueChange={setAba} className="mb-4">
        <TabsList>
          <TabsTrigger value="uncertain">🟡 Incertas</TabsTrigger>
          <TabsTrigger value="local">🟢 Laguna</TabsTrigger>
          <TabsTrigger value="outside">🔴 Fora</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <LoadingState titulo="Carregando análises..." />
      ) : comAnalise.length === 0 ? (
        <EmptyState
          titulo="Ainda não há análise geográfica salva"
          descricao="A análise passa a ser gravada nas notícias coletadas a partir de agora."
        />
      ) : lista.length === 0 ? (
        <EmptyState titulo="Nada nesta aba" descricao="Escolha outra situação acima." />
      ) : (
        <div className="space-y-3">
          {lista.map((noticia) => (
            <Card key={noticia.id}>
              <CardContent className="space-y-2 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <GeoBadge decisao={noticia.geo!.decision} />
                  {noticia.geo!.manual_decision ? (
                    <Badge variant="outline">
                      Sua decisão: {noticia.geo!.manual_decision === "local" ? "Laguna" : noticia.geo!.manual_decision === "outside" ? "Fora" : "Incerta"}
                    </Badge>
                  ) : null}
                  <Badge variant="secondary">pontuação {noticia.geo!.score}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {noticia.source_name ?? "Fonte"} · {formatarDataHora(noticia.discovered_at)}
                  </span>
                </div>

                <h2 className="text-sm font-semibold leading-snug">{noticia.title}</h2>
                <p className="text-xs text-muted-foreground">{noticia.geo!.reason}</p>
                {noticia.geo!.matched_localities.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Localidades: {noticia.geo!.matched_localities.join(", ")}
                  </p>
                ) : null}
                {noticia.geo!.excluded_localities.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Cidades de fora: {noticia.geo!.excluded_localities.join(", ")}
                  </p>
                ) : null}

                <Button size="sm" variant="outline" onClick={() => setEmRevisao(noticia)}>
                  Corrigir
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GeoReviewDialog
        key={emRevisao?.id ?? "sem-revisao"}
        noticia={emRevisao}
        aberto={!!emRevisao}
        onOpenChange={(v) => !v && setEmRevisao(null)}
        salvando={override.isPending}
        onSalvar={(entrada) => {
          if (!emRevisao) return;
          override.mutate(
            { news_id: emRevisao.id, ...entrada },
            { onSuccess: () => setEmRevisao(null) },
          );
        }}
      />
    </PageContainer>
  );
}
