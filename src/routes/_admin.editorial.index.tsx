import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ExternalLink, Check, X, RotateCcw, MapPin, PenLine } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GeoBadge } from "@/components/editorial/GeoBadge";
import { GeoReviewDialog } from "@/components/editorial/GeoReviewDialog";
import { PostComposerDialog } from "@/components/posts/PostComposerDialog";
import { useProject } from "@/hooks/useProject";
import {
  useCampanhas,
  useDecisaoEditorial,
  useFilaEditorial,
  useOverrideGeografico,
  usePatrocinadores,
  useSalvarPost,
} from "@/services/editorialQueries";
import { formatarDataHora } from "@/lib/format";
import type { NoticiaEditorial } from "@/services/editorialData";

export const Route = createFileRoute("/_admin/editorial/")({
  head: () => ({
    meta: [
      { title: "Caixa de entrada editorial | HORA NEWS LAGUNA" },
      {
        name: "description",
        content:
          "Central de decisão humana: aprove, rejeite ou envie para revisão as notícias coletadas em Laguna.",
      },
      { property: "og:title", content: "Caixa de entrada editorial | HORA NEWS LAGUNA" },
      {
        property: "og:description",
        content: "Decida o que vira publicação no perfil de notícias de Laguna.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditorialInboxPage,
});

const STATUS_ROTULO: Record<string, string> = {
  new: "Nova",
  analyzing: "Em análise",
  awaiting_approval: "Aguardando aprovação",
  review_required: "Precisa de revisão",
  approved: "Aprovada",
  rejected: "Rejeitada",
  scheduled: "Agendada",
  published: "Publicada",
  archived: "Arquivada",
  ignored: "Ignorada",
  duplicate: "Duplicada",
};

function decisaoVigente(n: NoticiaEditorial) {
  return n.geo ? (n.geo.manual_decision ?? n.geo.decision) : null;
}

function EditorialInboxPage() {
  const { data: projeto } = useProject();
  const projectId = projeto?.id;
  const { data: noticias, isLoading } = useFilaEditorial(projectId);
  const { data: patrocinadores } = usePatrocinadores(projectId);
  const { data: campanhas } = useCampanhas(projectId);

  const decisao = useDecisaoEditorial(projectId);
  const override = useOverrideGeografico(projectId);
  const salvarPost = useSalvarPost(projectId);

  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroGeo, setFiltroGeo] = useState("todos");
  const [filtroImportancia, setFiltroImportancia] = useState("todas");
  const [emRevisao, setEmRevisao] = useState<NoticiaEditorial | null>(null);
  const [emComposicao, setEmComposicao] = useState<NoticiaEditorial | null>(null);

  const lista = useMemo(() => {
    return (noticias ?? []).filter((n) => {
      if (filtroStatus !== "todos" && n.status !== filtroStatus) return false;
      if (filtroGeo !== "todos") {
        const atual = decisaoVigente(n);
        if (filtroGeo === "sem_analise" ? !!atual : atual !== filtroGeo) return false;
      }
      if (filtroImportancia === "alta" && n.importance_score < 8) return false;
      if (filtroImportancia === "media" && (n.importance_score < 5 || n.importance_score >= 8))
        return false;
      if (filtroImportancia === "baixa" && n.importance_score >= 5) return false;
      return true;
    });
  }, [noticias, filtroStatus, filtroGeo, filtroImportancia]);

  return (
    <PageContainer
      titulo="Caixa de entrada"
      descricao="Decida o que vira publicação. Nada é publicado automaticamente."
      acoes={
        <Button asChild variant="outline" size="sm">
          <Link to="/editorial/geografia">
            <MapPin className="size-4" />
            Revisão geográfica
          </Link>
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as situações</SelectItem>
            {Object.entries(STATUS_ROTULO).map(([valor, rotulo]) => (
              <SelectItem key={valor} value={valor}>
                {rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroGeo} onValueChange={setFiltroGeo}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Local" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Qualquer local</SelectItem>
            <SelectItem value="local">É de Laguna</SelectItem>
            <SelectItem value="uncertain">Incerta</SelectItem>
            <SelectItem value="outside">Fora de Laguna</SelectItem>
            <SelectItem value="sem_analise">Sem análise</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroImportancia} onValueChange={setFiltroImportancia}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Importância" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Qualquer importância</SelectItem>
            <SelectItem value="alta">Alta (8+)</SelectItem>
            <SelectItem value="media">Média (5 a 7)</SelectItem>
            <SelectItem value="baixa">Baixa (menos de 5)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <LoadingState titulo="Carregando fila editorial..." />
      ) : lista.length === 0 ? (
        <EmptyState
          titulo="Nenhuma notícia nesta fila"
          descricao="Ajuste os filtros ou aguarde a próxima coleta."
        />
      ) : (
        <div className="space-y-3">
          {lista.map((noticia) => (
            <Card key={noticia.id}>
              <CardContent className="space-y-3 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <GeoBadge
                    decisao={decisaoVigente(noticia)}
                    manual={!!noticia.geo?.manual_decision}
                  />
                  <Badge variant="outline">{STATUS_ROTULO[noticia.status] ?? noticia.status}</Badge>
                  {noticia.category_name ? (
                    <Badge variant="secondary">{noticia.category_name}</Badge>
                  ) : null}
                  <Badge variant="outline">importância {noticia.importance_score}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {noticia.source_name ?? "Fonte desconhecida"} ·{" "}
                    {formatarDataHora(noticia.discovered_at)}
                  </span>
                </div>

                <h2 className="text-sm font-semibold leading-snug text-foreground">
                  {noticia.title}
                </h2>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={decisao.isPending}
                    onClick={() =>
                      decisao.mutate({ news_id: noticia.id, decision: "approved" })
                    }
                  >
                    <Check className="size-4" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={decisao.isPending}
                    onClick={() =>
                      decisao.mutate({ news_id: noticia.id, decision: "review_required" })
                    }
                  >
                    <RotateCcw className="size-4" />
                    Revisar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={decisao.isPending}
                    onClick={() =>
                      decisao.mutate({ news_id: noticia.id, decision: "rejected" })
                    }
                  >
                    <X className="size-4" />
                    Rejeitar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEmRevisao(noticia)}>
                    <MapPin className="size-4" />
                    Local
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEmComposicao(noticia)}>
                    <PenLine className="size-4" />
                    Criar publicação
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/news/$id" params={{ id: noticia.id }}>
                      Abrir
                    </Link>
                  </Button>
                  {noticia.source_url ? (
                    <Button asChild size="sm" variant="ghost">
                      <a href={noticia.source_url} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-4" />
                        Fonte
                      </a>
                    </Button>
                  ) : null}
                </div>
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

      {emComposicao && projectId ? (
        <PostComposerDialog
          key={emComposicao.id}
          aberto
          onOpenChange={(v) => !v && setEmComposicao(null)}
          projectId={projectId}
          noticia={emComposicao}
          patrocinadores={patrocinadores ?? []}
          campanhas={campanhas ?? []}
          salvando={salvarPost.isPending}
          onSalvar={(entrada) =>
            salvarPost.mutate(entrada, { onSuccess: () => setEmComposicao(null) })
          }
        />
      ) : null}
    </PageContainer>
  );
}
