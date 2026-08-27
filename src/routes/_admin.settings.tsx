import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APP_NAME, CIDADE, ESTADO, NOME_DO_PERFIL } from "@/config/app";

export const Route = createFileRoute("/_admin/settings")({
  head: () => ({
    meta: [
      { title: "Configurações | Projeto Notícias Laguna" },
      {
        name: "description",
        content: "Ajuste as configurações do sistema de notícias.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [perfil, setPerfil] = useState(NOME_DO_PERFIL);
  const [cidade, setCidade] = useState(CIDADE);
  const [estado, setEstado] = useState(ESTADO);
  const [coletaAutomatica, setColetaAutomatica] = useState(true);
  const [intervaloColeta, setIntervaloColeta] = useState("30");
  const [aprovacaoAutomatica, setAprovacaoAutomatica] = useState(false);
  const [confiancaMinima, setConfiancaMinima] = useState("85");

  const handleSalvar = () => {
    toast.success("Configurações salvas (simulado — os dados não persistem ainda).");
  };

  return (
    <PageContainer
      titulo="Configurações"
      descricao="Ajuste os parâmetros do sistema."
      acoes={
        <Button size="sm" onClick={handleSalvar}>
          <Save className="size-4" />
          Salvar
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="perfil">Usuário do Instagram</Label>
              <Input
                id="perfil"
                value={perfil}
                onChange={(e) => setPerfil(e.target.value)}
                placeholder="@seuperfil"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  maxLength={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coleta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coleta de notícias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Coleta automática</p>
                <p className="text-xs text-muted-foreground">
                  Buscar notícias nas fontes automaticamente
                </p>
              </div>
              <Switch
                checked={coletaAutomatica}
                onCheckedChange={setColetaAutomatica}
                aria-label="Ativar coleta automática"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Intervalo de coleta</Label>
              <Select value={intervaloColeta} onValueChange={setIntervaloColeta}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">A cada 15 minutos</SelectItem>
                  <SelectItem value="30">A cada 30 minutos</SelectItem>
                  <SelectItem value="60">A cada 1 hora</SelectItem>
                  <SelectItem value="120">A cada 2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* IA */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inteligência Artificial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Aprovação automática</p>
                <p className="text-xs text-muted-foreground">
                  Aprovar notícias com confiança alta automaticamente
                </p>
              </div>
              <Switch
                checked={aprovacaoAutomatica}
                onCheckedChange={setAprovacaoAutomatica}
                aria-label="Ativar aprovação automática"
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="confianca">Confiança mínima para aprovação (%)</Label>
              <Input
                id="confianca"
                type="number"
                min={50}
                max={100}
                value={confiancaMinima}
                onChange={(e) => setConfiancaMinima(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Notícias com confiança abaixo deste valor serão marcadas para revisão obrigatória.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sobre */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sobre o sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">{APP_NAME}</strong></p>
            <p>Versão: 0.1.0 (MVP com dados simulados)</p>
            <p>Stack: TanStack Start + React + Tailwind + shadcn/ui + Supabase</p>
            <p>Status: Em desenvolvimento — dados simulados, sem conexão real com fontes ou Instagram.</p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
