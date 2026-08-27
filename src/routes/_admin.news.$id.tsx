import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  XCircle,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfidenceBadge } from "@/components/news/ConfidenceBadge";
import { InstagramPreview } from "@/components/news/InstagramPreview";
import { ArtePreview } from "@/components/news/ArtePreview";
import { NewsTimeline } from "@/components/news/NewsTimeline";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { alterarStatus, useNoticia } from "@/services/newsStore";
import { formatarDataHora } from "@/lib/format";

export const Route = createFileRoute("/_admin/news/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da notícia | Projeto Notícias Laguna" },
      {
        name: "description",
        content: "Visualize os detalhes da notícia, conteúdo gerado pela IA e controle de status.",
      },
    ],
  }),
  component: NewsDetailPage,
});

function NewsDetailPage() {
  const { id } = Route.useParams();
  const noticia = useNoticia(id);

  if (!noticia) {
    return (
      <PageContainer titulo="Notícia não encontrada">
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground">A notícia solicitada não existe ou foi removida.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/news">Voltar às notícias</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  const handleAprovar = () => {
    alterarStatus(noticia.id, "aprovada");
    toast.success("Notícia aprovada");
  };

  const handleRejeitar = () => {
    alterarStatus(noticia.id, "rejeitada");
    toast.success("Notícia rejeitada");
  };

  const handleIgnorar = () => {
    alterarStatus(noticia.id, "ignorada");
    toast.success("Notícia ignorada");
  };

  const handlePublicar = () => {
    alterarStatus(noticia.id, "publicada");
    toast.success("Publicação simulada — Instagram ainda não conectado");
  };

  const handleCopiarLegenda = () => {
    navigator.clipboard?.writeText(`${noticia.gerado.legenda}\n\n${noticia.gerado.hashtags}`);
    toast.success("Legenda copiada");
  };

  return (
    <PageContainer
      titulo={noticia.gerado.titulo || noticia.titulo}
      descricao={`${noticia.fonte} • ${formatarDataHora(noticia.horario)}`}
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
        {/* Coluna principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Metadados */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={noticia.status} />
                <CategoryBadge categoria={noticia.categoria} />
                <ConfidenceBadge confianca={noticia.confiancaIA} />
                {noticia.duplicada && (
                  <Badge variant="secondary">Duplicada</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Título original</h3>
                <p className="mt-1 text-foreground">{noticia.titulo}</p>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Resumo</h3>
                <p className="mt-1 text-foreground">{noticia.resumo}</p>
              </div>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Conteúdo completo</h3>
                <p className="mt-1 whitespace-pre-line text-foreground">{noticia.conteudo}</p>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-muted-foreground">Fonte:</h3>
                <a
                  href={noticia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  {noticia.fonte}
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Análise da IA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Análise da IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{noticia.importanciaNota}/10</p>
                  <p className="text-xs text-muted-foreground">Importância</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{noticia.confiancaIA}%</p>
                  <p className="text-xs text-muted-foreground">Confiança</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{noticia.duplicada ? "Sim" : "Não"}</p>
                  <p className="text-xs text-muted-foreground">Duplicada</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Explicação</h4>
                <p className="mt-1 text-sm text-foreground">{noticia.explicacaoIA}</p>
              </div>
            </CardContent>
          </Card>

          {/* Conteúdo gerado */}
          <Tabs defaultValue="legenda">
            <TabsList>
              <TabsTrigger value="legenda">Legenda</TabsTrigger>
              <TabsTrigger value="preview">Preview Instagram</TabsTrigger>
              <TabsTrigger value="arte">Arte</TabsTrigger>
            </TabsList>
            <TabsContent value="legenda" className="mt-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Título sugerido</h4>
                    <p className="mt-1 font-medium text-foreground">{noticia.gerado.titulo}</p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Legenda</h4>
                    <p className="mt-1 whitespace-pre-line text-foreground">{noticia.gerado.legenda}</p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Hashtags</h4>
                    <p className="mt-1 text-sm text-primary">{noticia.gerado.hashtags}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopiarLegenda}>
                    <Copy className="size-4" />
                    Copiar legenda + hashtags
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="preview" className="mt-4">
              <InstagramPreview noticia={noticia} />
            </TabsContent>
            <TabsContent value="arte" className="mt-4">
              <ArtePreview textoArte={noticia.gerado.textoArte} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(noticia.status === "aguardando_aprovacao" || noticia.status === "revisao_obrigatoria" || noticia.status === "em_analise") && (
                <Button className="w-full" onClick={handleAprovar}>
                  <CheckCircle2 className="size-4" />
                  Aprovar
                </Button>
              )}
              {noticia.status === "aprovada" && (
                <Button className="w-full" onClick={handlePublicar}>
                  <Send className="size-4" />
                  Publicar
                </Button>
              )}
              {noticia.status !== "publicada" && noticia.status !== "rejeitada" && noticia.status !== "ignorada" && (
                <>
                  <Button variant="outline" className="w-full" onClick={handleIgnorar}>
                    <EyeOff className="size-4" />
                    Ignorar
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={handleRejeitar}>
                    <XCircle className="size-4" />
                    Rejeitar
                  </Button>
                </>
              )}
              {noticia.status === "publicada" && (
                <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-950">
                  <Eye className="mx-auto size-5 text-green-600" />
                  <p className="mt-1 text-sm font-medium text-green-700 dark:text-green-400">Publicada</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <NewsTimeline noticia={noticia} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
