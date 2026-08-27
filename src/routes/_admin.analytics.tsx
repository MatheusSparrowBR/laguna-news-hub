import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { BarChart3, Eye, Newspaper, Send, TrendingUp } from "lucide-react";
import { PageContainer, SectionCard } from "@/components/layout/PageContainer";
import { MetricCard } from "@/components/common/MetricCard";
import { PublicationsChart, ReachChart } from "@/components/dashboard/OverviewChart";
import {
  listarNoticias,
  listarPublicacoes,
  obterEstatisticasInstagram,
  obterMetricasDiarias,
} from "@/services/mockService";
import { formatarNumero } from "@/lib/format";

export const Route = createFileRoute("/_admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics | Projeto Notícias Laguna" },
      {
        name: "description",
        content: "Análise de desempenho do perfil e das publicações.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const noticias = useMemo(() => listarNoticias(), []);
  const publicacoes = useMemo(() => listarPublicacoes(), []);
  const metricas = useMemo(() => obterMetricasDiarias(), []);
  const instagram = useMemo(() => obterEstatisticasInstagram(), []);

  const totalPublicadas = publicacoes.filter((p) => p.status === "publicada").length;
  const totalVisualizacoes = publicacoes.reduce((acc, p) => acc + p.visualizacoes, 0);
  const totalCurtidas = publicacoes.reduce((acc, p) => acc + p.curtidas, 0);

  return (
    <PageContainer
      titulo="Analytics"
      descricao="Visão analítica do desempenho (dados simulados)."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          titulo="Total de notícias"
          valor={noticias.length}
          icone={Newspaper}
          descricao="no banco de dados"
        />
        <MetricCard
          titulo="Publicações"
          valor={totalPublicadas}
          icone={Send}
          descricao="enviadas ao Instagram"
        />
        <MetricCard
          titulo="Visualizações totais"
          valor={formatarNumero(totalVisualizacoes)}
          icone={Eye}
          descricao="todas as publicações"
        />
        <MetricCard
          titulo="Curtidas totais"
          valor={formatarNumero(totalCurtidas)}
          icone={TrendingUp}
          descricao="todas as publicações"
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

      {/* Distribuição por categoria */}
      <div className="mt-6">
        <SectionCard titulo="Distribuição por categoria">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(
              noticias.reduce(
                (acc, n) => {
                  acc[n.categoria] = (acc[n.categoria] || 0) + 1;
                  return acc;
                },
                {} as Record<string, number>,
              ),
            )
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => (
                <div
                  key={cat}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm font-medium text-foreground">{cat}</span>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Nota:</strong> Todos os dados são simulados. Analytics reais serão carregados
          quando o Supabase e a API do Instagram estiverem integrados.
        </p>
      </div>
    </PageContainer>
  );
}
