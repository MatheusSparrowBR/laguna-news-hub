import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Newspaper,
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
import {
  listarNoticias,
  listarPublicacoes,
  obterEstatisticasInstagram,
  obterMetricasDiarias,
} from "@/services/mockService";
import { ehHoje, formatarNumero } from "@/lib/format";

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
  const noticias = listarNoticias();
  const publicacoes = listarPublicacoes();
  const metricas = obterMetricasDiarias();
  const instagram = obterEstatisticasInstagram();

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
