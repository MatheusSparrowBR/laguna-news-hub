import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Instagram, RefreshCw, Unplug } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useProject } from "@/hooks/useProject";
import {
  useConectarInstagram,
  useDesconectarInstagram,
  useEstadoInstagram,
  useVerificarInstagram,
} from "@/services/editorialQueries";
import { formatarDataHora } from "@/lib/format";
import { toast } from "sonner";

const MENSAGEM_RETORNO: Record<string, { tipo: "ok" | "erro"; texto: string }> = {
  conectado: { tipo: "ok", texto: "Instagram conectado." },
  recusado: { tipo: "erro", texto: "A autorização foi recusada no Instagram." },
  estado_invalido: {
    tipo: "erro",
    texto: "O pedido de conexão não é mais válido. Clique em Conectar Instagram novamente.",
  },
  sem_autorizacao: { tipo: "erro", texto: "O Instagram não devolveu a autorização." },
  perfil_indisponivel: {
    tipo: "erro",
    texto: "Não foi possível ler o perfil autorizado. Confirme que a conta é profissional.",
  },
  falha: { tipo: "erro", texto: "Não foi possível concluir a conexão. Tente novamente." },
};

export const Route = createFileRoute("/_admin/instagram")({
  validateSearch: (search: Record<string, unknown>) => ({
    instagram: typeof search["instagram"] === "string" ? search["instagram"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Instagram | HORA NEWS LAGUNA" },
      {
        name: "description",
        content: "Conecte a conta profissional do Instagram e acompanhe a situação da conexão.",
      },
      { property: "og:title", content: "Instagram | HORA NEWS LAGUNA" },
      {
        property: "og:description",
        content: "Conexão oficial com a conta profissional do Instagram do HORA NEWS LAGUNA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InstagramPage,
});

const ROTULO_SITUACAO: Record<string, string> = {
  connected: "Conectado",
  disconnected: "Não conectado",
  connecting: "Conectando",
  expired: "Autorização expirada",
  error: "Com problema",
};

function InstagramPage() {
  const { instagram: retorno } = useSearch({ from: "/_admin/instagram" });
  const { data: projeto } = useProject();
  const projectId = projeto?.id;
  const { data: estado, isLoading } = useEstadoInstagram(projectId);
  const conectar = useConectarInstagram(projectId);
  const verificar = useVerificarInstagram(projectId);
  const desconectar = useDesconectarInstagram(projectId);

  useEffect(() => {
    if (!retorno) return;
    const aviso = MENSAGEM_RETORNO[retorno];
    if (!aviso) return;
    if (aviso.tipo === "ok") toast.success(aviso.texto);
    else toast.error(aviso.texto);
  }, [retorno]);

  const conectado = estado?.conectado === true;
  const situacao = estado?.status ?? "disconnected";

  return (
    <PageContainer
      titulo="Instagram"
      descricao="Conexão oficial com a conta profissional do Instagram."
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Instagram className="size-5" />
            Instagram
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Instagram className="size-6 text-muted-foreground" aria-hidden="true" />
              </div>
              <div>
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  {conectado ? (
                    <>
                      <span className="text-green-600" aria-hidden="true">
                        🟢
                      </span>
                      Instagram conectado
                    </>
                  ) : (
                    <>Status: {isLoading ? "carregando…" : ROTULO_SITUACAO[situacao] ?? "Não conectado"}</>
                  )}
                </p>
                {conectado ? (
                  <p className="text-sm text-muted-foreground">
                    {estado?.username ? `@${estado.username}` : "conta profissional"}
                    {estado?.connected_at
                      ? ` · conectado em ${formatarDataHora(estado.connected_at)}`
                      : ""}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    É necessária uma conta profissional (Business ou Creator).
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!conectado && (
                <Button
                  onClick={() => conectar.mutate()}
                  disabled={!projectId || conectar.isPending || estado?.configurado === false}
                >
                  {conectar.isPending ? "Redirecionando…" : "Conectar Instagram"}
                </Button>
              )}
              {conectado && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => verificar.mutate()}
                    disabled={verificar.isPending}
                  >
                    <RefreshCw className="mr-2 size-4" aria-hidden="true" />
                    {verificar.isPending ? "Verificando…" : "Verificar conexão"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">
                        <Unplug className="mr-2 size-4" aria-hidden="true" />
                        Desconectar Instagram
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Desconectar o Instagram?</AlertDialogTitle>
                        <AlertDialogDescription>
                          A autorização será apagada e nenhuma publicação poderá ser enviada até
                          conectar de novo. Publicações, histórico, campanhas e patrocinadores são
                          preservados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => desconectar.mutate()}>
                          Desconectar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>

          {!conectado && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Ao clicar em <strong>Conectar Instagram</strong> você será levado ao site do Instagram
              para autorizar o acesso. Nada é publicado durante a conexão.
            </p>
          )}

          {conectado && estado?.last_verified_at && (
            <p className="text-xs text-muted-foreground">
              Última verificação: {formatarDataHora(estado.last_verified_at)}
            </p>
          )}

          {conectado && (
            <div className="flex flex-wrap gap-2">
              {(estado?.scopes ?? []).map((permissao) => (
                <Badge key={permissao} variant="secondary">
                  {permissao}
                </Badge>
              ))}
            </div>
          )}

          {!!estado?.pendencias?.length && (
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
                Passos pendentes
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {estado.pendencias.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {conectado && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-green-600" aria-hidden="true" />
              Publicação manual liberada na fila de publicações. Nada é publicado
              automaticamente.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Desempenho</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Sem dados do Instagram ainda.</p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
