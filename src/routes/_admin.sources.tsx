import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Globe,
  Rss,
  Share2,
  Plus,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatarDataHora } from "@/lib/format";
import { estadoFonte, ROTULO_ESTADO, type EstadoFonte } from "@/lib/rules/sourceHealth";
import type { Source } from "@/lib/types";
import { toast } from "sonner";
import { useProject } from "@/hooks/useProject";
import { useFontes, useCriarFonte, useAlterarFonteAtiva } from "@/services/queries";
import { useModoDados } from "@/services/dataMode";
import {
  executarColetaDeNoticias,
  obterUltimaExecucao,
  type CollectNewsResult,
  type UltimaExecucao,
} from "@/services/collectNews";
import { useQueryClient } from "@tanstack/react-query";
import { CollectResultPanel } from "@/components/sources/CollectResultPanel";

export const Route = createFileRoute("/_admin/sources")({
  head: () => ({
    meta: [
      { title: "Fontes | HORA NEWS LAGUNA" },
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
  api: Share2,
  official: Share2,
} as const;

const tipoLabel = {
  site: "Site",
  rss: "RSS",
  api: "API",
  official: "Oficial",
} as const;

function SourcesPage() {
  const modo = useModoDados();
  const { data: projeto } = useProject();
  const queryClient = useQueryClient();
  const {
    data: fontes = [],
    isLoading,
    error,
  } = useFontes(projeto?.id);
  const alterarFonte = useAlterarFonteAtiva();
  const [ultimaExecucao, setUltimaExecucao] = useState<UltimaExecucao | null>(null);
  const [carregandoExecucao, setCarregandoExecucao] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [dialogAberto, setDialogAberto] = useState(false);

  // Estado do resultado detalhado da última coleta (em memória)
  const [resultadoColeta, setResultadoColeta] = useState<CollectNewsResult | null>(null);
  const [coletaExecutadaEm, setColetaExecutadaEm] = useState<string>("");

  const carregarUltimaExecucao = () => {
    if (modo === "banco" && projeto?.id) {
      setCarregandoExecucao(true);
      obterUltimaExecucao(projeto.id)
        .then(setUltimaExecucao)
        .catch(() => setUltimaExecucao(null))
        .finally(() => setCarregandoExecucao(false));
    }
  };

  useEffect(() => {
    carregarUltimaExecucao();
  }, [modo, projeto?.id]);

  const handleAtualizar = async () => {
    if (!projeto?.id || atualizando) return;
    setAtualizando(true);
    setResultadoColeta(null);
    try {
      const resultado = await executarColetaDeNoticias(projeto.id);

      setResultadoColeta(resultado);
      setColetaExecutadaEm(new Date().toISOString());

      toast.success("Coleta concluída", {
        description: `Fontes verificadas: ${resultado.sources_checked} | Encontradas: ${resultado.total_found} | Novas: ${resultado.total_new} | Duplicadas: ${resultado.total_duplicate} | Erros: ${resultado.total_errors}`,
        duration: 8000,
      });

      // Invalidar queries relevantes para atualizar a interface
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["noticias"] }),
        queryClient.invalidateQueries({ queryKey: ["fontes"] }),
        queryClient.invalidateQueries({ queryKey: ["publicacoes"] }),
        queryClient.invalidateQueries({ queryKey: ["analytics"] }),
        queryClient.invalidateQueries({ queryKey: ["projeto-atual"] }),
      ]);

      // Recarregar última execução
      carregarUltimaExecucao();
    } catch (err: any) {
      console.error("[sources] Erro na coleta:", err.message);
      toast.error(err.message ?? "Erro ao executar coleta de notícias");
    } finally {
      setAtualizando(false);
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
              onClick={handleAtualizar}
              disabled={!projeto?.id || atualizando}
            >
              {atualizando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {atualizando ? "Coletando notícias..." : "Atualizar notícias"}
            </Button>
          )}
          {modo === "banco" ? (
            <AddSourceDialog
              projectId={projeto?.id}
              open={dialogAberto}
              onOpenChange={setDialogAberto}
            />
          ) : (
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
      {/* Painel de resultado detalhado da coleta */}
      {modo === "banco" && resultadoColeta && projeto?.id && (
        <CollectResultPanel
          resultado={resultadoColeta}
          executadoEm={coletaExecutadaEm}
          projectId={projeto.id}
          totalFontesNoProjeto={fontes.length}
        />
      )}

      {/* Status da coleta (resumo do banco) */}
      {modo === "banco" && !resultadoColeta && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status da coleta</CardTitle>
          </CardHeader>
          <CardContent>
            {carregandoExecucao ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Carregando...
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
                    <p className="text-xs text-muted-foreground">Novas notícias</p>
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
              <p className="text-sm text-muted-foreground">
                Nenhuma coleta realizada ainda. Clique em "Atualizar notícias" para executar a primeira coleta.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <LoadingState titulo="Carregando fontes..." />
      ) : error ? (
        <EmptyState titulo="Erro ao carregar fontes" descricao={error.message} />
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
              onToggle={async (checked) => {
                if (modo === "demo") {
                  toast.info("Alteração de status simulada — mude para modo banco.");
                  return;
                }
                await alterarFonte.mutateAsync({ id: fonte.id, active: checked });
                toast.success(checked ? "Fonte ativada" : "Fonte desativada");
              }}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

const CLASSE_ESTADO: Record<EstadoFonte, string> = {
  saudavel: "border-primary/40 bg-primary/10 text-primary",
  atencao: "border-warning/40 bg-warning/10 text-warning-foreground",
  falha: "border-destructive/40 bg-destructive/10 text-destructive",
};

const PONTO_ESTADO: Record<EstadoFonte, string> = {
  saudavel: "🟢",
  atencao: "🟡",
  falha: "🔴",
};

function SourceCard({
  fonte,
  modo,
  onToggle,
}: {
  fonte: Source;
  modo: string;
  onToggle: (checked: boolean) => Promise<void>;
}) {
  const Icone = tipoIcone[fonte.tipo];
  const isWebsiteSemRss = fonte.tipo === "site";
  const falhas = fonte.falhasConsecutivas ?? 0;
  const estado = estadoFonte({
    consecutive_failures: falhas,
    last_error: fonte.ultimoErro ?? null,
  });

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
            onCheckedChange={onToggle}
            aria-label={`Ativar/desativar ${fonte.nome}`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={fonte.ativa ? "default" : "secondary"}>
            {fonte.ativa ? "Ativa" : "Inativa"}
          </Badge>
          <Badge variant="outline">{tipoLabel[fonte.tipo]}</Badge>
          <Badge variant="outline" className={CLASSE_ESTADO[estado]}>
            {PONTO_ESTADO[estado]} {ROTULO_ESTADO[estado]}
          </Badge>
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
          <p className="text-xs text-amber-600">
            Coleta automática ainda não configurada para esta fonte.
          </p>
        )}

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t pt-3 text-xs">
          <div>
            <dt className="text-muted-foreground">Última verificação</dt>
            <dd className="font-medium text-foreground">{formatarDataHora(fonte.ultimaColeta)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Resposta do site</dt>
            <dd className="font-medium text-foreground">{fonte.ultimoHttpStatus ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Última notícia</dt>
            <dd className="font-medium text-foreground">
              {fonte.ultimaNoticiaEm ? formatarDataHora(fonte.ultimaNoticiaEm) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Falhas seguidas</dt>
            <dd className="font-medium text-foreground">{falhas}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground">Notícias coletadas</dt>
            <dd className="font-medium text-foreground">{fonte.noticiasColetadas}</dd>
          </div>
        </dl>

        {fonte.ultimoErro ? (
          <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
            Último erro: {fonte.ultimoErro}
          </p>
        ) : null}

        {modo === "demo" ? null : null}
      </CardContent>
    </Card>
  );
}


function AddSourceDialog({
  projectId,
  open,
  onOpenChange,
}: {
  projectId?: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const criarFonte = useCriarFonte();
  const [nome, setNome] = useState("");
  const [url, setUrl] = useState("");
  const [rssUrl, setRssUrl] = useState("");
  const [tipo, setTipo] = useState<string>("rss");

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

    await criarFonte.mutateAsync({
      projectId,
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
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="official">Oficial</SelectItem>
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
          <Button
            onClick={handleSalvar}
            disabled={criarFonte.isPending || !projectId}
            className="w-full"
          >
            {criarFonte.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar fonte
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
