import { createFileRoute } from "@tanstack/react-router";
import { Eye, Heart, Send, TrendingUp } from "lucide-react";
import { PageContainer, SectionCard } from "@/components/layout/PageContainer";
import { MetricCard } from "@/components/common/MetricCard";
import { PublicationsChart, ReachChart } from "@/components/dashboard/OverviewChart";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import {
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
        content:
          "Métricas de alcance, engajamento e desempenho das publicações de notícias de Laguna.",
      },
      { property: "og:title", content: "Analytics | Projeto Notícias Laguna" },
      {
        property: "og:description",
        content: "Métricas das publicações de notícias de Laguna - SC.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const metricas = obterMetricasDiarias();
  const stats = obterEstatisticasInstagram();
  const publicadas = listarPublicacoes().filter((p) => p.status === "publicada");

  const totalPublicacoes = metricas.reduce((soma, m) => soma + m.publicacoes, 0);
  const totalCurtidas = publicadas.reduce((soma, p) => soma + p.curtidas, 0);

  const melhores = [...publicadas].sort((a, b) => b.visualizacoes - a.visualizacoes);

  return (
    <PageContainer titulo="Analytics" descricao="Últimos 7 dias (dados simulados)">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          titulo="Publicações (7 dias)"
          valor={totalPublicacoes}
          icone={Send}
        />
        <MetricCard
          titulo="Alcance (7 dias)"
          valor={formatarNumero(stats.alcance7dias)}
          icone={Eye}
        />
        <MetricCard titulo="Curtidas" valor={formatarNumero(totalCurtidas)} icone={Heart} />
        <MetricCard
          titulo="Engajamento médio"
          valor={`${stats.engajamentoMedio}%`}
          icone={TrendingUp}
          variacao={stats.crescimentoSemana}
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

      <div className="mt-6">
        <SectionCard titulo="Publicações com melhor desempenho">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Título</th>
                  <th className="pb-3 pr-4 font-medium">Categoria</th>
                  <th className="pb-3 pr-4 font-medium">Visualizações</th>
                  <th className="pb-3 font-medium">Curtidas</th>
                </tr>
              </thead>
              <tbody>
                {melhores.map((p) => (
                  <tr key={p.id} className="border-b border-border/70 last:border-0">
                    <td className="py-3 pr-4 font-medium text-foreground">{p.titulo}</td>
                    <td className="py-3 pr-4">
                      <CategoryBadge categoria={p.categoria} />
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {formatarNumero(p.visualizacoes)}
                    </td>
                    <td className="py-3 text-muted-foreground">{formatarNumero(p.curtidas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
