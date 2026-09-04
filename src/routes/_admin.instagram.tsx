import { createFileRoute } from "@tanstack/react-router";
import {
  Eye,
  Instagram,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { MetricCard } from "@/components/common/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { obterEstatisticasInstagram } from "@/services/mockService";
import { formatarNumero } from "@/lib/format";
import { NOME_DO_PERFIL } from "@/config/app";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/instagram")({
  head: () => ({
    meta: [
      { title: "Instagram | HORA NEWS LAGUNA" },
      {
        name: "description",
        content: "Monitore o desempenho do perfil do Instagram e conecte sua conta.",
      },
    ],
  }),
  component: InstagramPage,
});

function InstagramPage() {
  const stats = obterEstatisticasInstagram();

  return (
    <PageContainer
      titulo="Instagram"
      descricao="Desempenho e conexão com o perfil do Instagram."
    >
      {/* Conexão */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Instagram className="size-5" />
            Conta conectada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                <Instagram className="size-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{NOME_DO_PERFIL}</p>
                <div className="flex items-center gap-1.5">
                  {stats.contaConectada ? (
                    <>
                      <Wifi className="size-3 text-green-500" />
                      <span className="text-xs text-green-600">Conectada</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="size-3 text-amber-500" />
                      <span className="text-xs text-amber-600">Não conectada</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant={stats.contaConectada ? "outline" : "default"}
              onClick={() =>
                toast.info(
                  "Conexão com a API do Instagram será implementada em breve.",
                )
              }
            >
              {stats.contaConectada ? "Reconectar" : "Conectar conta"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          titulo="Seguidores"
          valor={formatarNumero(stats.seguidores)}
          icone={Users}
          descricao="total do perfil"
        />
        <MetricCard
          titulo="Crescimento semanal"
          valor={`${stats.crescimentoSemana}%`}
          icone={TrendingUp}
          variacao={stats.crescimentoSemana}
          descricao="últimos 7 dias"
        />
        <MetricCard
          titulo="Alcance hoje"
          valor={formatarNumero(stats.alcanceHoje)}
          icone={Eye}
          descricao="contas alcançadas"
        />
        <MetricCard
          titulo="Alcance 7 dias"
          valor={formatarNumero(stats.alcance7dias)}
          icone={Eye}
          descricao="contas alcançadas"
        />
      </div>

      {/* Engajamento */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Engajamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{stats.engajamentoMedio}%</p>
              <p className="text-xs text-muted-foreground">Taxa média por publicação</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                O engajamento médio mede curtidas, comentários e compartilhamentos em relação ao
                número de seguidores. Quando a conta for conectada, essas métricas serão atualizadas
                em tempo real.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Nota:</strong> Os dados exibidos são simulados. Para ativar as métricas reais,
          conecte a conta do Instagram pela API oficial (Meta Graph API). Isso será implementado
          nas próximas etapas do projeto.
        </p>
      </div>
    </PageContainer>
  );
}
