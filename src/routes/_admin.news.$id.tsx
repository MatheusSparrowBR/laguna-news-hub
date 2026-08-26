import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Clock, Copy, ExternalLink, Radio } from "lucide-react";
import { PageContainer, SectionCard } from "@/components/layout/PageContainer";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { obterNoticia } from "@/services/mockService";
import { formatarDataHora } from "@/lib/format";
import { NOME_DO_PERFIL } from "@/config/app";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/news/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da notícia | Projeto Notícias Laguna" },
      {
        name: "description",
        content:
          "Revise o resumo gerado, a legenda sugerida e aprove ou rejeite a publicação da notícia.",
      },
      { property: "og:title", content: "Detalhe da notícia | Projeto Notícias Laguna" },
      {
        property: "og:description",
        content: "Revisão e aprovação de notícias de Laguna - SC.",
      },
    ],
  }),
  component: NewsDetailPage,
});

function NewsDetailPage() {
  const { id } = Route.useParams();
  const noticia = obterNoticia(id);
  const [confirmar, setConfirmar] = useState<"aprovar" | "rejeitar" | null>(null);
  const [artePreview, setArtePreview] = useState(false);
  const [legenda, setLegenda] = useState(noticia?.sugestaoLegenda ?? "");

  if (!noticia) {
    return (
      <PageContainer titulo="Notícia não encontrada">
        <EmptyState
          titulo="Notícia não encontrada"
          descricao="Esta notícia pode ter sido removida."
          acao={
            <Button asChild>
              <Link to="/news">Voltar para notícias</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      titulo={noticia.titulo}
      descricao={`${noticia.fonte} · ${formatarDataHora(noticia.horario)}`}
      acoes={
        <Button asChild variant="ghost" size="sm">
          <Link to="/news">
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard titulo="Notícia original">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge categoria={noticia.categoria} />
              <StatusBadge tipo="noticia" valor={noticia.status} />
              <StatusBadge tipo="importancia" valor={noticia.importancia} />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold leading-snug text-foreground">
              {noticia.titulo}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Radio className="size-3.5" />
                {noticia.fonte}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {formatarDataHora(noticia.horario)}
              </span>
              <a
                href={noticia.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <ExternalLink className="size-3.5" />
                Abrir fonte
              </a>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground">{noticia.conteudo}</p>
          </SectionCard>

          <SectionCard titulo="Resumo gerado por IA (simulado)">
            <p className="text-sm leading-relaxed text-muted-foreground">{noticia.resumo}</p>
          </SectionCard>

          <SectionCard
            titulo="Conteúdo para Instagram"
            acao={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard?.writeText(legenda);
                  toast.success("Legenda copiada");
                }}
              >
                <Copy className="size-4" />
                Copiar
              </Button>
            }
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Título sugerido
                </p>
                <p className="mt-1 font-display text-base font-semibold text-foreground">
                  {noticia.sugestaoTitulo ?? "Sugestão ainda não gerada"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Legenda
                </p>
                <Textarea
                  className="mt-2 min-h-32"
                  value={legenda}
                  onChange={(e) => setLegenda(e.target.value)}
                  placeholder="Legenda ainda não gerada para esta notícia."
                />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard titulo="Ações">
            <div className="space-y-2">
              <Button className="w-full" onClick={() => setConfirmar("aprovar")}>
                Aprovar publicação
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setConfirmar("rejeitar")}
              >
                Rejeitar
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setArtePreview(true)}>
                Visualizar arte
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Publicação real no Instagram ({NOME_DO_PERFIL}) será ativada em etapa futura.
            </p>
          </SectionCard>

          {noticia.duplicadaDe && (
            <SectionCard titulo="Possível duplicidade">
              <p className="text-sm text-muted-foreground">
                Esta notícia parece ser duplicada de outra já coletada.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to="/news/$id" params={{ id: noticia.duplicadaDe }}>
                  Ver notícia original
                </Link>
              </Button>
            </SectionCard>
          )}
        </div>
      </div>

      <ConfirmationDialog
        aberto={confirmar !== null}
        onOpenChange={(aberto) => !aberto && setConfirmar(null)}
        titulo={confirmar === "rejeitar" ? "Rejeitar notícia?" : "Aprovar publicação?"}
        descricao={
          confirmar === "rejeitar"
            ? "A notícia será marcada como rejeitada e não gerará publicação."
            : "A notícia será enviada para a fila de publicações."
        }
        destrutivo={confirmar === "rejeitar"}
        textoConfirmar={confirmar === "rejeitar" ? "Rejeitar" : "Aprovar"}
        onConfirmar={() => {
          toast.success(
            confirmar === "rejeitar"
              ? "Notícia rejeitada (simulado)"
              : "Notícia aprovada (simulado)",
          );
          setConfirmar(null);
        }}
      />

      <Modal
        aberto={artePreview}
        onOpenChange={setArtePreview}
        titulo="Pré-visualização da arte"
        descricao="Montagem simulada com o template padrão."
      >
        <div className="aspect-square w-full overflow-hidden rounded-xl bg-primary p-6">
          <div className="flex h-full flex-col justify-between">
            <span className="inline-flex w-fit rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
              {noticia.categoria}
            </span>
            <p className="font-display text-2xl font-bold leading-tight text-primary-foreground">
              {noticia.sugestaoTitulo ?? noticia.titulo}
            </p>
            <span className="text-xs font-medium text-primary-foreground/80">
              {NOME_DO_PERFIL}
            </span>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
