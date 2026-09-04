import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingState } from "@/components/common/LoadingState";
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
import { useProject } from "@/hooks/useProject";
import { useConfiguracoes, useSalvarConfiguracoes, useSalvarProjeto } from "@/services/queries";
import { useModoDados } from "@/services/dataMode";

export const Route = createFileRoute("/_admin/settings")({
  head: () => ({
    meta: [
      { title: "Configurações | HORA NEWS LAGUNA" },
      {
        name: "description",
        content: "Ajuste as configurações do sistema de notícias.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: projeto } = useProject();
  const { data: configuracoes, isLoading } = useConfiguracoes(projeto?.id);
  const salvarConfig = useSalvarConfiguracoes();
  const salvarProj = useSalvarProjeto();
  const modo = useModoDados();

  const [perfil, setPerfil] = useState(NOME_DO_PERFIL);
  const [cidade, setCidade] = useState(CIDADE);
  const [estado, setEstado] = useState(ESTADO);
  const [coletaAutomatica, setColetaAutomatica] = useState(false);
  const [intervaloColeta, setIntervaloColeta] = useState("30");
  const [aprovacaoAutomatica, setAprovacaoAutomatica] = useState(false);
  const [confiancaMinima, setConfiancaMinima] = useState("85");

  useEffect(() => {
    if (projeto) {
      setPerfil(projeto.profile_name ?? projeto.instagram_username ?? NOME_DO_PERFIL);
      setCidade(projeto.city ?? CIDADE);
      setEstado(projeto.state ?? ESTADO);
    }
    if (configuracoes) {
      setColetaAutomatica(configuracoes.auto_publish_enabled);
      setAprovacaoAutomatica(configuracoes.approval_required);
      setIntervaloColeta(String(configuracoes.minimum_interval_minutes));
      setConfiancaMinima(String(configuracoes.minimum_confidence));
    }
  }, [projeto, configuracoes]);

  const handleSalvar = async () => {
    if (!projeto?.id) return;

    if (modo === "demo") {
      toast.success("Configurações salvas (modo demonstração — sem persistência).");
      return;
    }

    await salvarProj.mutateAsync({
      projectId: projeto.id,
      valores: {
        name: `${APP_NAME}`,
        profile_name: perfil,
        instagram_username: perfil,
      },
    });

    await salvarConfig.mutateAsync({
      projectId: projeto.id,
      valores: {
        auto_publish_enabled: coletaAutomatica,
        approval_required: aprovacaoAutomatica,
        minimum_interval_minutes: Number(intervaloColeta) || 30,
        minimum_confidence: Number(confiancaMinima) || 85,
      },
    });

    toast.success("Configurações salvas");
  };

  return (
    <PageContainer
      titulo="Configurações"
      descricao="Ajuste os parâmetros do sistema."
      acoes={
        <Button size="sm" onClick={handleSalvar} disabled={salvarConfig.isPending || salvarProj.isPending || !projeto?.id}>
          <Save className="size-4" />
          Salvar
        </Button>
      }
    >
      {isLoading ? (
        <LoadingState titulo="Carregando configurações..." />
      ) : (
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
                  <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
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
                  <p className="text-xs text-muted-foreground">Buscar notícias nas fontes automaticamente</p>
                </div>
                <Switch
                  checked={coletaAutomatica}
                  onCheckedChange={setColetaAutomatica}
                  aria-label="Ativar coleta automática"
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Intervalo mínimo entre publicações (minutos)</Label>
                <Select value={intervaloColeta} onValueChange={setIntervaloColeta}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
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
                  <p className="text-xs text-muted-foreground">Aprovar notícias com confiança alta automaticamente</p>
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
              <p>
                <strong className="text-foreground">{APP_NAME}</strong>
              </p>
              <p>Versão: 0.2.0 (integrado ao banco de dados)</p>
              <p>Stack: TanStack Start + React + Tailwind + shadcn/ui + Lovable Cloud</p>
              <p>
                Modo atual: <strong>{modo === "banco" ? "dados reais" : "demonstração"}</strong>
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
