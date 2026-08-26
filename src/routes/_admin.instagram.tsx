import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Instagram, TrendingUp, Users } from "lucide-react";
import { PageContainer, SectionCard } from "@/components/layout/PageContainer";
import { MetricCard } from "@/components/common/MetricCard";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { obterEstatisticasInstagram, listarPublicacoes } from "@/services/mockService";
import { formatarDataHora, formatarNumero } from "@/lib/format";
import { NOME_DO_PERFIL } from "@/config/app";
import { StatusBadge } from "@/components/common/StatusBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/instagram")({
  head: () => ({
    meta: [
      { title: "Instagram | Projeto Notícias Laguna" },
      {
        name: "description",
        content:
          "Situação da conexão com o Instagram, agenda de publicações e desempenho do perfil de notícias de Laguna.",
      },
      { property: "og:title", content: "Instagram | Projeto Notícias Laguna" },
      {
        property: "og:description",
        content: "Conexão e agenda de publicações do perfil de notícias de Laguna - SC.",
      },
    ],
  }),
  component: InstagramPage,
});

function InstagramPage() {
  const stats = obterEstatisticasInstagram();
  const agendadas = listarPublicacoes().filter((p) => p.status === "agendada");
  const [confirmarConexao, setConfirmarConexao] = useState(false);

  return (
    <PageContainer
      titulo="Instagram"
      descricao={`Perfil configurado: ${NOME_DO_PERFIL}`}
    >
      <SectionCard titulo="Conexão da conta">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Instagram className="size-5" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold text-foreground">
                {NOME_DO_PERFIL}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {stats.contaConectada
                  ? "Conta conectada"
                  : "Conta ainda não conectada — integração oficial será ativada em etapa futura."}
              </p>
            </div>
          </div>
          <Button onClick={() => setConfirmarConexao(true)}>Conectar conta</Button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="perfil">Nome do perfil</Label>
            <Input id="perfil" defaultValue={NOME_DO_PERFIL} />
            <p className="text-xs text-muted-foreground">
              Definido em src/config/app.ts (NOME_DO_PERFIL).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fuso">Fuso horário das publicações</Label>
            <Input id="fuso" defaultValue="America/Sao_Paulo" readOnly />
          </div>
        </div>
      </SectionCard>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          titulo="Seguidores"
          valor={formatarNumero(stats.seguidores)}
          icone={Users}
        />
        <MetricCard
          titulo="Crescimento (7 dias)"
          valor={`${stats.crescimentoSemana}%`}
          icone={TrendingUp}
          variacao={stats.crescimentoSemana}
        />
        <MetricCard
          titulo="Alcance hoje"
          valor={formatarNumero(stats.alcanceHoje)}
          icone={Eye}
        />
        <MetricCard
          titulo="Alcance (7 dias)"
          valor={formatarNumero(stats.alcance7dias)}
          icone={Eye}
        />
      </div>

      <div className="mt-6">
        <SectionCard titulo="Publicações agendadas">
          {agendadas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma publicação agendada.</p>
          ) : (
            <div className="space-y-3">
              {agendadas.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-2 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">
                      {p.titulo}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatarDataHora(p.horario)} · Template: {p.template}
                    </p>
                  </div>
                  <StatusBadge tipo="publicacao" valor={p.status} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <ConfirmationDialog
        aberto={confirmarConexao}
        onOpenChange={setConfirmarConexao}
        titulo="Conectar conta do Instagram?"
        descricao="A integração oficial ainda não está implementada nesta etapa do projeto."
        textoConfirmar="Entendi"
        onConfirmar={() => toast.info("Integração será ativada em etapa futura")}
      />
    </PageContainer>
  );
}
