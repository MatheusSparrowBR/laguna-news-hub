import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Newspaper,
  Rss,
  TrendingUp,
  Users,
} from "lucide-react";
import { MetricCard } from "@/components/common/MetricCard";
import { NewsCard } from "@/components/common/NewsCard";
import { PublicationCard } from "@/components/common/PublicationCard";
import { EmptyState } from "@/components/common/EmptyState";
import { PageContainer, SectionCard } from "@/components/layout/PageContainer";
import { PublicationsChart, ReachChart } from "@/components/dashboard/OverviewChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  listarNoticias,
  listarPublicacoes,
  obterEstatisticasInstagram,
  obterMetricasDiarias,
} from "@/services/mockService";
import { ehHoje, formatarDataHora, formatarNumero } from "@/lib/format";
import { useModoDados } from "@/services/dataMode";
import { obterUltimaExecucao, type UltimaExecucao } from "@/services/collectNews";
import { obterProjetoAtual } from "@/services/supabaseData";

export const Route = createFileRoute("/_admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Projeto Notícias Laguna" },
      {
        name: "description",
        content:
          "Visão geral das notícias encontradas, aprovações pendentes e desempenho do perfil de notícias de Laguna.",
      },
      { property: "og:title", content: "Dashboard | Projeto Notícias Laguna" },
      {
        property: "og:description",
        content: "Visão geral do painel de notícias locais de Laguna - SC.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const modo = useModoDados();
  const noticias = listarNoticias();
  const publicacoes = listarPublicacoes();
  const metricas = obterMetricasDiarias();
  const instagram = obterEstatisticasInstagram();
  const [ultimaExecucao, setUltimaExecucao] = useState<UltimaExecucao | null>(null);

  useEffect(() => {
    if (modo === "banco") {
      obterProjetoAtual().then((proj) => {
        if (proj) {
          obterUltimaExecucao(proj.id).then(setUltimaExecucao).catch(console.error);
        }
      }).catch(console.error);
    }
  }, [modo]);

  const encontradasHoje = noticias.filter((n) => ehHoje(n.horario)).length;
  const aguardando = noticias.filter((n) => n.status === "aguardando_aprovacao").length;
  const publicadasHoje = publicacoes.filter(
    (p) => p.status === "publicada" && ehHoje(p.horario),
  ).length;
  const urgentes = noticias.filter((n) => n.importancia === "urgente").length;

  const ultimasNoticias = noticias.slice(0, 5);
  const publicacoesHoje = publicacoes.filter((p) => ehHoje(p.horario));

  return (
    <PageContainer
      titulo="Dashboard"
      descricao="Resumo do dia em Laguna - SC (dados simulados)"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          titulo="Notícias encontradas hoje"
          valor={encontradasHoje}
          icone={Newspaper}
          descricao="nas fontes ativas"
        />
        <MetricCard
          titulo="Aguardando aprovação"
          valor={aguardando}
          icone={AlertTriangle}
          descricao="para revisar"
          destaque="alerta"
        />
        <MetricCard
          titulo="Publicadas hoje"
          valor={publicadasHoje}
          icone={CheckCircle2}
          descricao="no Instagram"
        />
        <MetricCard
          titulo="Notícias urgentes"
          valor={urgentes}
          icone={AlertTriangle}
          descricao="prioridade máxima"
          destaque="urgente"
        />
        <MetricCard
          titulo="Alcance do Instagram"
          valor={formatarNumero(instagram.alcanceHoje)}
          icone={Eye}
          descricao="contas alcançadas hoje"
        />
        <MetricCard
          titulo="Seguidores"
          valor={formatarNumero(instagram.seguidores)}
          icone={Users}
          descricao="total do perfil"
        />
        <MetricCard
          titulo="Crescimento de seguidores"
          valor={`${instagram.crescimentoSemana}%`}
          icone={TrendingUp}
          variacao={instagram.crescimentoSemana}
          descricao="últimos 7 dias"
        />
        <MetricCard
          titulo="Engajamento médio"
          valor={`${instagram.engajamentoMedio}%`}
          icone={TrendingUp}
          descricao="por publicação"
        />
      </div>

      {/* Última atualização das fontes */}
      {modo === "banco" && (
        <div className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Rss className="size-4" />
                Última atualização das fontes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ultimaExecucao ? (
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Horário</p>
                      <p className="text-sm font-medium">{formatarDataHora(ultimaExecucao.started_at)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium capitalize">{ultimaExecucao.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Novas notícias</p>
                    <p className="text-sm font-medium">{ultimaExecucao.items_processed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Erros</p>
                    <p className="text-sm font-medium">{ultimaExecucao.error_message ?? "Nenhum"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma coleta realizada. Vá até Fontes e clique em "Verificar fontes agora".
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard titulo="Publicações por dia">
          <PublicationsChart dados={metricas} />
        </SectionCard>
        <SectionCard titulo="Alcance por dia">
          <ReachChart dados={metricas} />
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <SectionCard
          titulo="Últimas notícias"
          acao={
            <Button asChild variant="ghost" size="sm">
              <Link to="/news">Ver todas</Link>
            </Button>
          }
        >
          <div className="space-y-3">
            {ultimasNoticias.map((n) => (
              <NewsCard key={n.id} noticia={n} />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          titulo="Publicações de hoje"
          acao={
            <Button asChild variant="ghost" size="sm">
              <Link to="/publications">Ver todas</Link>
            </Button>
          }
        >
          {publicacoesHoje.length === 0 ? (
            <EmptyState
              titulo="Nenhuma publicação hoje"
              descricao="As publicações aprovadas e agendadas aparecerão aqui."
            />
          ) : (
            <div className="space-y-3">
              {publicacoesHoje.map((p) => (
                <PublicationCard key={p.id} publicacao={p} />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </PageContainer>
  );
}
