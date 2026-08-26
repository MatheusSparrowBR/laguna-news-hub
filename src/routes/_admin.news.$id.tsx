import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Ban,
  CalendarClock,
  Check,
  Clock,
  Copy,
  ExternalLink,
  EyeOff,
  Radio,
  Save,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer, SectionCard } from "@/components/layout/PageContainer";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { ConfidenceBadge } from "@/components/news/ConfidenceBadge";
import { ArtePreview } from "@/components/news/ArtePreview";
import { EditableField } from "@/components/news/EditableField";
import { InstagramPreview } from "@/components/news/InstagramPreview";
import { NewsTimeline } from "@/components/news/NewsTimeline";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/common/Modal";
import { formatarDataHora } from "@/lib/format";
import { montarHistorico } from "@/lib/newsFlow";
import type { ConteudoGerado } from "@/lib/types";
import { alterarStatus, salvarConteudo, useNoticia } from "@/services/newsStore";
import { NOME_DO_PERFIL } from "@/config/app";

export const Route = createFileRoute("/_admin/news/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da notícia | Projeto Notícias Laguna" },
      {
        name: "description",
        content:
          "Revise o conteúdo original, a análise da IA e o material preparado para o Instagram antes de aprovar a publicação.",
      },
      { property: "og:title", content: "Detalhe da notícia | Projeto Notícias Laguna" },
      {
        property: "og:description",
        content: "Revisão editorial das notícias de Laguna - SC.",
      },
    ],
  }),
  component: NewsDetailPage,
});

type Acao = "aprovar" | "rejeitar" | "ignorar" | "publicar" | "agendar";

const textosAcao: Record<Acao, { titulo: string; descricao: string; confirmar: string }> = {
  aprovar: {
    titulo: "Aprovar notícia?",
    descricao: "A notícia será marcada como aprovada e entra na fila de publicações.",
    confirmar: "Aprovar",
  },
  rejeitar: {
    titulo: "Rejeitar notícia?",
    descricao: "A notícia será marcada como rejeitada e não gerará publicação.",
    confirmar: "Rejeitar",
  },
  ignorar: {
    titulo: "Ignorar notícia?",
    descricao: "A notícia sai do fluxo editorial, mas continua no histórico.",
    confirmar: "Ignorar",
  },
  publicar: {
    titulo: "Publicar agora?",
    descricao:
      "Nesta etapa a publicação é apenas simulada. A integração oficial com o Instagram será ativada depois.",
    confirmar: "Publicar (simulado)",
  },
  agendar: {
    titulo: "Agendar publicação?",
    descricao:
      "O agendamento é simulado nesta etapa: a notícia é aprovada e ficaria na fila de publicações.",
    confirmar: "Agendar (simulado)",
  },
};

function NewsDetailPage() {
  const { id } = Route.useParams();
  const noticia = useNoticia(id);

  const [conteudo, setConteudo] = useState<ConteudoGerado | null>(noticia?.gerado ?? null);
  const [acao, setAcao] = useState<Acao | null>(null);
  const [arteAberta, setArteAberta] = useState(false);

  useEffect(() => {
    if (noticia) setConteudo(noticia.gerado);
  }, [noticia?.id]);

  if (!noticia || !conteudo) {
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

  const set = <K extends keyof ConteudoGerado>(chave: K, valor: string) =>
    setConteudo({ ...conteudo, [chave]: valor });

  const regenerar = (rotulo: string) =>
    toast.info(`${rotulo} regenerado (simulado) — IA real será conectada depois`);

  const confirmarAcao = () => {
    if (!acao) return;
    if (acao === "aprovar") alterarStatus(noticia.id, "aprovada");
    if (acao === "rejeitar") alterarStatus(noticia.id, "rejeitada");
    if (acao === "ignorar") alterarStatus(noticia.id, "ignorada");
    if (acao === "publicar") alterarStatus(noticia.id, "publicada");
    if (acao === "agendar") alterarStatus(noticia.id, "aprovada");
    toast.success(`Ação "${textosAcao[acao].confirmar}" aplicada ao estado simulado`);
    setAcao(null);
  };

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
          {/* Seção 1 — conteúdo original */}
          <SectionCard
            titulo="Conteúdo original"
            acao={
              <Button asChild variant="outline" size="sm">
                <a href={noticia.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  Abrir fonte original
                </a>
              </Button>
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge categoria={noticia.categoria} />
              <StatusBadge tipo="noticia" valor={noticia.status} />
              <StatusBadge tipo="importancia" valor={noticia.importancia} />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold leading-snug text-foreground">
              {noticia.titulo}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Radio className="size-3.5" />
                {noticia.fonte}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                Publicada em {formatarDataHora(noticia.horario)}
              </span>
              <span className="break-all">{noticia.url}</span>
            </div>
            <div className="mt-4">
              <ArtePreview
                categoria={noticia.categoria}
                texto={noticia.titulo}
                className="aspect-video"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Imagem original simulada nesta etapa.
              </p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground">{noticia.conteudo}</p>
          </SectionCard>

          {/* Seção 2 — análise da IA */}
          <SectionCard titulo="Análise da IA">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Info rotulo="Cidade identificada" valor={noticia.cidade} />
              <Info rotulo="Estado" valor={noticia.estado} />
              <Info rotulo="Categoria" valor={noticia.categoria} />
              <Info rotulo="Importância (0 a 10)" valor={`${noticia.importanciaNota}`} />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Confiança da IA
                </dt>
                <dd className="mt-1">
                  <ConfidenceBadge valor={noticia.confiancaIA} />
                </dd>
              </div>
              <Info
                rotulo="Conteúdo duplicado"
                valor={noticia.duplicada ? "Sim" : "Não"}
              />
              <Info
                rotulo="Grupo de duplicidade"
                valor={noticia.grupoDuplicidade ?? "Nenhum"}
              />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status de moderação
                </dt>
                <dd className="mt-1">
                  <StatusBadge tipo="noticia" valor={noticia.status} />
                </dd>
              </div>
            </dl>

            <div className="mt-5 rounded-lg border border-border bg-secondary p-4">
              <p className="text-sm font-medium text-foreground">
                Por que a IA classificou esta notícia assim?
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {noticia.explicacaoIA}
              </p>
            </div>

            {noticia.duplicadaDe && (
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/news/$id" params={{ id: noticia.duplicadaDe }}>
                  Ver notícia original do grupo
                </Link>
              </Button>
            )}
          </SectionCard>

          {/* Seção 3 — conteúdo gerado */}
          <div id="conteudo">
            <SectionCard
              titulo="Conteúdo gerado"
              acao={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `${conteudo.legenda}\n\n${conteudo.hashtags}`,
                    );
                    toast.success("Legenda copiada");
                  }}
                >
                  <Copy className="size-4" />
                  Copiar
                </Button>
              }
            >
              <div className="space-y-5">
                <EditableField
                  rotulo="Título para Instagram"
                  valor={conteudo.titulo}
                  onChange={(v) => set("titulo", v)}
                  onRegenerar={() => regenerar("Título")}
                />
                <EditableField
                  rotulo="Resumo"
                  valor={conteudo.resumo}
                  onChange={(v) => set("resumo", v)}
                  onRegenerar={() => regenerar("Resumo")}
                  multilinha
                  linhas={3}
                />
                <EditableField
                  rotulo="Legenda"
                  valor={conteudo.legenda}
                  onChange={(v) => set("legenda", v)}
                  onRegenerar={() => regenerar("Legenda")}
                  multilinha
                  linhas={5}
                />
                <EditableField
                  rotulo="Hashtags"
                  valor={conteudo.hashtags}
                  onChange={(v) => set("hashtags", v)}
                  onRegenerar={() => regenerar("Hashtags")}
                />
                <EditableField
                  rotulo="Texto sugerido para a arte"
                  valor={conteudo.textoArte}
                  onChange={(v) => set("textoArte", v)}
                  onRegenerar={() => regenerar("Texto da arte")}
                  multilinha
                  linhas={3}
                  ajuda="Cada linha aparece como uma linha da arte."
                />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                A geração por IA ainda é simulada nesta etapa.
              </p>
            </SectionCard>
          </div>

          {/* Seção 6 — histórico */}
          <SectionCard titulo="Histórico">
            <NewsTimeline etapas={montarHistorico(noticia)} />
            <p className="mt-4 text-xs text-muted-foreground">
              Horários simulados a partir da coleta da notícia.
            </p>
          </SectionCard>
        </div>

        <div className="space-y-6">
          {/* Seção 4 — preview do Instagram */}
          <SectionCard
            titulo="Preview do Instagram"
            acao={
              <Button variant="ghost" size="sm" onClick={() => setArteAberta(true)}>
                Ver arte
              </Button>
            }
          >
            <InstagramPreview
              categoria={noticia.categoria}
              titulo={conteudo.titulo}
              legenda={conteudo.legenda}
              hashtags={conteudo.hashtags}
              textoArte={conteudo.textoArte}
              curtidas={412}
              comentarios={27}
            />
          </SectionCard>

          {/* Seção 5 — ações editoriais */}
          <SectionCard titulo="Ações editoriais">
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => {
                  salvarConteudo(noticia.id, conteudo);
                  toast.success("Alterações salvas (estado simulado)");
                }}
              >
                <Save className="size-4" />
                Salvar alterações
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setAcao("aprovar")}>
                <Check className="size-4" />
                Aprovar
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setAcao("publicar")}>
                <Send className="size-4" />
                Publicar agora
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setAcao("agendar")}>
                <CalendarClock className="size-4" />
                Agendar
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setAcao("ignorar")}>
                <EyeOff className="size-4" />
                Ignorar
              </Button>
              <Button
                variant="ghost"
                className="w-full text-destructive hover:text-destructive"
                onClick={() => setAcao("rejeitar")}
              >
                <Ban className="size-4" />
                Rejeitar
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              As ações alteram apenas o estado simulado. A publicação real em {NOME_DO_PERFIL}{" "}
              será ativada em etapa futura.
            </p>
          </SectionCard>
        </div>
      </div>

      <Modal
        aberto={arteAberta}
        onOpenChange={setArteAberta}
        titulo="Arte da publicação"
        descricao="Pré-visualização simulada da arte gerada a partir do template."
      >
        <ArtePreview categoria={noticia.categoria} texto={conteudo.textoArte} />
      </Modal>

      <ConfirmationDialog
        aberto={acao !== null}
        onOpenChange={(aberto) => !aberto && setAcao(null)}
        titulo={acao ? textosAcao[acao].titulo : ""}
        descricao={acao ? textosAcao[acao].descricao : ""}
        textoConfirmar={acao ? textosAcao[acao].confirmar : "Confirmar"}
        destrutivo={acao === "rejeitar" || acao === "ignorar"}
        onConfirmar={confirmarAcao}
      />
    </PageContainer>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{valor}</dd>
    </div>
  );
}
