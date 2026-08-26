import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, SectionCard } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { CATEGORIAS } from "@/lib/types";
import { APP_NAME, CIDADE_COMPLETA, NOME_DO_PERFIL } from "@/config/app";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/settings")({
  head: () => ({
    meta: [
      { title: "Configurações | Projeto Notícias Laguna" },
      {
        name: "description",
        content:
          "Ajuste nome do perfil, categorias, horários de publicação e preferências do painel de notícias de Laguna.",
      },
      { property: "og:title", content: "Configurações | Projeto Notícias Laguna" },
      {
        property: "og:description",
        content: "Preferências do painel de notícias de Laguna - SC.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <PageContainer titulo="Configurações" descricao="Preferências gerais do painel">
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard titulo="Identidade do projeto">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome-projeto">Nome do projeto</Label>
              <Input id="nome-projeto" defaultValue={APP_NAME} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="perfil-ig">Nome do perfil no Instagram</Label>
              <Input id="perfil-ig" defaultValue={NOME_DO_PERFIL} />
              <p className="text-xs text-muted-foreground">
                Valor padrão definido em src/config/app.ts (NOME_DO_PERFIL).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade alvo</Label>
              <Input id="cidade" defaultValue={CIDADE_COMPLETA} readOnly />
            </div>
          </div>
        </SectionCard>

        <SectionCard titulo="Coleta e automação">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="intervalo">Intervalo de coleta (minutos)</Label>
              <Input id="intervalo" type="number" defaultValue={30} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Detectar duplicadas</p>
                <p className="text-xs text-muted-foreground">
                  Marca automaticamente notícias repetidas.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Aprovar manualmente</p>
                <p className="text-xs text-muted-foreground">
                  Nada é publicado sem sua confirmação.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Alerta de urgentes</p>
                <p className="text-xs text-muted-foreground">
                  Destaca notícias urgentes no dashboard.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </SectionCard>

        <SectionCard titulo="Categorias monitoradas">
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((c) => (
              <CategoryBadge key={c} categoria={c} />
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            As categorias são definidas em src/lib/types.ts.
          </p>
        </SectionCard>

        <SectionCard titulo="Modelo de legenda">
          <Textarea
            className="min-h-32"
            defaultValue={`{EMOJI} {CATEGORIA} | {TITULO}\n\n{RESUMO}\n\nFonte: {FONTE}\n${NOME_DO_PERFIL}`}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            As variáveis entre chaves serão preenchidas automaticamente na etapa de geração.
          </p>
        </SectionCard>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => toast.success("Configurações salvas (simulado)")}>
          Salvar configurações
        </Button>
      </div>
    </PageContainer>
  );
}
