import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Globe, Rss, Share2, Plus, Play, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatarDataHora } from "@/lib/format";
import type { Source } from "@/lib/types";
import { toast } from "sonner";
import { useModoDados } from "@/services/dataMode";
import { listarFontes } from "@/services/mockService";
import { obterFontes, obterProjetoAtual, criarFonte, alterarFonteAtiva } from "@/services/supabaseData";
import { executarColetaDeNoticias, obterUltimaExecucao, type CollectNewsResult, type UltimaExecucao } from "@/services/collectNews";

export const Route = createFileRoute("/_admin/sources")({
  head: () => ({
    meta: [
      { title: "Fontes | Projeto Notícias Laguna" },
      {
        name: "description",
        content: "Gerencie as fontes de notícias monitoradas pelo sistema.",
      },
    ],
  }),
  component: SourcesPage,
});

const tipoIcone = {
  site: Globe,
  rss: Rss,
  rede_social: Share2,
} as const;

const tipoLabel = {
  site: "Site",
  rss: "RSS",
  rede_social: "Rede social",
} as const;

function SourcesPage() {
  const modo = useModoDados();
  const [fontes, setFontes] = useState<Source[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [coletando, setColetando] = useState(false);
  const [ultimaExecucao, setUltimaExecucao] = useState<UltimaExecucao | null>(null);
  const [resultadoColeta, setResultadoColeta] = useState<CollectNewsResult | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      if (modo === "demo") {
        setFontes(listarFontes());
        setProjectId(null);
      } else {
        const projeto = await obterProjetoAtual();
        if (projeto) {
          setProjectId(projeto.id);
          const fontesDb = await obterFontes(projeto.id);
          setFontes(fontesDb);
          const ultima = await obterUltimaExecucao(projeto.id);
          setUltimaExecucao(ultima);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar fontes");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [modo]);

  const handleColetar = async () => {
    if (!projectId) {
      toast.error("Projeto não encontrado");
      return;
    }
    setColetando(true);
    setResultadoColeta(null);
    try {
      const resultado = await executarColetaDeNoticias(projectId);
      setResultadoColeta(resultado);
      toast.success(
        `Coleta finalizada: ${resultado.total_new} notícia(s) nova(s) de ${resultado.sources_checked} fonte(s)`
      );
      // Refresh data
      await carregarDados();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao executar coleta");
    } finally {
      setColetando(false);
    }
  };

  return (
    <PageContainer
      titulo="Fontes"
      descricao={modo === "demo" ? "Fontes de notícias (dados simulados)." : "Fontes de notícias monitoradas pelo sistema."}
      acoes={
        <div className="flex items-center gap-2">
          {modo === "banco" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleColetar}
              disabled={coletando || !projectId}
            >
              {coletando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              Verificar fontes agora
            </Button>
          )}
          {modo === "banco" && (
            <AddSourceDialog
              projectId={projectId}
              open={dialogAberto}
              onOpenChange={setDialogAberto}
              onCreated={carregarDados}
            />
          )}
          {modo === "demo" && (
            <Button
              size="sm"
              onClick={() => toast.info("Cadastro de fontes disponível no modo banco.")}
            >
              <Plus className="size-4" />
              Adicionar fonte
            </Button>
          )}
        </div>
      }
    >
      {/* Status da coleta */}
      {modo === "banco" && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status da coleta</CardTitle>
          </CardHeader>
          <CardContent>
            {resultadoColeta ? (
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Última execução</p>
                    <p className="text-sm font-medium">Agora</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Rss className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fontes verificadas</p>
                    <p className="text-sm font-medium">{resultadoColeta.sources_checked}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Notícias novas</p>
                    <p className="text-sm font-medium">{resultadoColeta.total_new}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-4 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Erros</p>
                    <p className="text-sm font-medium">{resultadoColeta.total_errors}</p>
                  </div>
                </div>
              </div>
            ) : ultimaExecucao ? (
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Última execução</p>
                    <p className="text-sm font-medium">{formatarDataHora(ultimaExecucao.started_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Rss className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium capitalize">{ultimaExecucao.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Notícias novas</p>
                    <p className="text-sm font-medium">{ultimaExecucao.items_processed}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-4 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Erros</p>
                    <p className="text-sm font-medium">{ultimaExecucao.error_message ?? "Nenhum"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma coleta realizada ainda. Clique em "Verificar fontes agora" para iniciar.</p>
            )}
          </CardContent>
        </Card>
      )}

      {carregando ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : fontes.length === 0 ? (
        <EmptyState
          icone={Rss}
          titulo="Nenhuma fonte cadastrada"
          descricao="Adicione uma fonte RSS para começar a monitorar notícias."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {fontes.map((fonte) => (
            <SourceCard
              key={fonte.id}
              fonte={fonte}
              modo={modo}
              projectId={projectId}
              onToggle={carregarDados}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function SourceCard({
  fonte,
  modo,
  projectId,
  onToggle,
}: {
  fonte: Source;
  modo: string;
  projectId: string | null;
  onToggle: () => void;
}) {
  const Icone = tipoIcone[fonte.tipo];
  const isWebsiteSemRss = fonte.tipo === "site";

  const handleToggle = async (checked: boolean) => {
    if (modo === "demo") {
      toast.info("Alteração de status simulada — mude para modo banco.");
      return;
    }
    try {
      await alterarFonteAtiva(fonte.id, checked);
      toast.success(checked ? "Fonte ativada" : "Fonte desativada");
      onToggle();
    } catch {
      toast.error("Erro ao alterar status da fonte");
    }
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icone className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">{fonte.nome}</h3>
          </div>
          <Switch
            checked={fonte.ativa}
            onCheckedChange={handleToggle}
            aria-label={`Ativar/desativar ${fonte.nome}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={fonte.ativa ? "default" : "secondary"}>
            {fonte.ativa ? "Ativa" : "Inativa"}
          </Badge>
          <Badge variant="outline">{tipoLabel[fonte.tipo]}</Badge>
        </div>

        <a
          href={fonte.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-xs text-primary hover:underline"
        >
          {fonte.url}
        </a>

        {isWebsiteSemRss && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Coleta automática ainda não configurada para esta fonte.
          </p>
        )}

        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>{fonte.noticiasColetadas} notícias coletadas</span>
          <span>Última: {formatarDataHora(fonte.ultimaColeta)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function AddSourceDialog({
  projectId,
  open,
  onOpenChange,
  onCreated,
}: {
  projectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [nome, setNome] = useState("");
  const [url, setUrl] = useState("");
  const [rssUrl, setRssUrl] = useState("");
  const [tipo, setTipo] = useState<string>("rss");
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    if (!projectId) return;
    if (!nome.trim() || !url.trim()) {
      toast.error("Preencha o nome e a URL da fonte.");
      return;
    }
    if (tipo === "rss" && !rssUrl.trim()) {
      toast.error("Informe a URL do feed RSS.");
      return;
    }

    setSalvando(true);
    try {
      await criarFonte(projectId, {
        name: nome.trim(),
        url: url.trim(),
        source_type: tipo,
        rss_url: tipo === "rss" ? rssUrl.trim() : null,
      });
      toast.success("Fonte cadastrada com sucesso!");
      setNome("");
      setUrl("");
      setRssUrl("");
      setTipo("rss");
      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao cadastrar fonte");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Adicionar fonte
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar nova fonte</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="fonte-nome">Nome da fonte</Label>
            <Input
              id="fonte-nome"
              placeholder="Ex: Portal de Laguna"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fonte-url">URL do site</Label>
            <Input
              id="fonte-url"
              placeholder="https://exemplo.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fonte-tipo">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="fonte-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rss">RSS</SelectItem>
                <SelectItem value="website">Website</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {tipo === "rss" && (
            <div className="space-y-2">
              <Label htmlFor="fonte-rss">URL do feed RSS</Label>
              <Input
                id="fonte-rss"
                placeholder="https://exemplo.com/feed.xml"
                value={rssUrl}
                onChange={(e) => setRssUrl(e.target.value)}
              />
            </div>
          )}
          {tipo === "website" && (
            <p className="text-xs text-amber-600">
              Coleta automática ainda não disponível para websites. Apenas fontes RSS são coletadas automaticamente.
            </p>
          )}
          <Button onClick={handleSalvar} disabled={salvando} className="w-full">
            {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar fonte
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
