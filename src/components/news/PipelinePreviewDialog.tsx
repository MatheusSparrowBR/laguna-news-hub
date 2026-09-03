import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { previewPipelineServer } from "@/lib/pipelinePreview.functions";
import type {
  AvaliacaoPreview,
  ResultadoPreview,
  ResultadoPreviewLote,
} from "@/lib/pipelinePreview.server";

interface PipelinePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | undefined;
  /** Até 10 ids de notícias existentes. */
  newsIds: string[];
}

const CORES_DECISAO: Record<string, string> = {
  local: "border-green-300 text-green-700",
  outside: "border-red-300 text-red-700",
  uncertain: "border-amber-300 text-amber-700",
};

function DecisionBadge({ decisao }: { decisao: string }) {
  return (
    <Badge variant="outline" className={CORES_DECISAO[decisao] ?? ""}>
      {decisao.toUpperCase()}
    </Badge>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2 py-0.5 text-sm">
      <span className="min-w-40 text-xs uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </span>
      <span className="font-medium">{valor}</span>
    </div>
  );
}

function listar(itens: string[]): string {
  return itens.length > 0 ? itens.join(", ") : "—";
}

function resumoGeo(a: AvaliacaoPreview): string {
  return `${a.geo.decision.toUpperCase()} (${a.geo.score})`;
}

function DetalhePreview({ item }: { item: ResultadoPreview }) {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="mb-1 text-sm font-semibold">Conteúdo</h3>
        <Linha rotulo="Fonte" valor={item.source_name ?? "—"} />
        <Linha rotulo="Conteúdo" valor={item.conteudo_usado} />
        <Linha rotulo="Tamanho RSS" valor={`${item.rss_chars} caracteres`} />
        <Linha rotulo="Tamanho completo" valor={`${item.full_chars} caracteres`} />
      </section>

      <Separator />

      <section>
        <h3 className="mb-1 text-sm font-semibold">Status do fetch</h3>
        <Linha
          rotulo="Content fetch"
          valor={
            item.fetch_status === "success"
              ? "SUCCESS"
              : item.fetch_status === "fallback-rss"
                ? "FALLBACK RSS"
                : "ERROR"
          }
        />
        <Linha rotulo="HTTP status" valor={item.http_status ?? "—"} />
        <Linha rotulo="Tempo" valor={`${item.fetch_ms} ms`} />
        <Linha rotulo="Extração" valor={item.fetch_via ?? "—"} />
        <Linha rotulo="Motivo" valor={item.fetch_reason ?? "—"} />
      </section>

      <Separator />

      <section>
        <h3 className="mb-1 text-sm font-semibold">Geográfico</h3>
        <Linha rotulo="Decisão" valor={<DecisionBadge decisao={item.final.geo.decision} />} />
        <Linha rotulo="Score" valor={item.final.geo.score} />
        <Linha rotulo="Localidades" valor={listar(item.final.geo.matched_localities)} />
        <Linha rotulo="Entidades" valor={listar(item.final.geo.matched_entities)} />
        <Linha
          rotulo="Municípios externos"
          valor={listar(item.final.geo.excluded_localities)}
        />
        <Linha rotulo="Motivo" valor={item.final.geo.reason} />
      </section>

      <Separator />

      <section>
        <h3 className="mb-1 text-sm font-semibold">Classificação</h3>
        <Linha rotulo="Categoria atual" valor={item.categoria_atual ?? "—"} />
        <Linha rotulo="Categoria prevista" valor={item.final.classificacao.category_name} />
        <Linha rotulo="Importance atual" valor={item.importance_atual ?? "—"} />
        <Linha rotulo="Importance previsto" valor={item.final.classificacao.importance_score} />
        <Linha rotulo="Keywords" valor={listar(item.final.classificacao.matched_keywords)} />
      </section>

      <Separator />

      <section>
        <h3 className="mb-1 text-sm font-semibold">Comparação</h3>
        <Linha rotulo="RSS → Laguna Scope" valor={resumoGeo(item.com_rss)} />
        <Linha
          rotulo="Completo → Laguna Scope"
          valor={item.com_full ? resumoGeo(item.com_full) : "— (sem conteúdo completo)"}
        />
        <Linha rotulo="RSS → Categoria" valor={item.com_rss.classificacao.category_name} />
        <Linha
          rotulo="Completo → Categoria"
          valor={item.com_full ? item.com_full.classificacao.category_name : "—"}
        />
      </section>
    </div>
  );
}

function TabelaPreview({ resultado }: { resultado: ResultadoPreviewLote }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {resultado.resumo.total} notícia(s) · UNCERTAIN → LOCAL{" "}
        {resultado.resumo.uncertain_para_local} · UNCERTAIN → OUTSIDE{" "}
        {resultado.resumo.uncertain_para_outside} · UNCERTAIN → UNCERTAIN{" "}
        {resultado.resumo.uncertain_para_uncertain} · categoria mudou{" "}
        {resultado.resumo.categoria_mudou}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="p-1">ID</th>
              <th className="p-1">Título</th>
              <th className="p-1">Fonte</th>
              <th className="p-1">RSS</th>
              <th className="p-1">Full</th>
              <th className="p-1">Geo RSS</th>
              <th className="p-1">Geo Full</th>
              <th className="p-1">Cat. atual</th>
              <th className="p-1">Cat. prevista</th>
              <th className="p-1">Imp. atual</th>
              <th className="p-1">Imp. previsto</th>
            </tr>
          </thead>
          <tbody>
            {resultado.itens.map((item) => (
              <tr key={item.id} className="border-t align-top">
                <td className="p-1 font-mono">{item.id.slice(0, 8)}</td>
                <td className="p-1 max-w-56 truncate">{item.title}</td>
                <td className="p-1">{item.source_name ?? "—"}</td>
                <td className="p-1">{item.rss_chars}</td>
                <td className="p-1">{item.full_chars}</td>
                <td className="p-1">{resumoGeo(item.com_rss)}</td>
                <td className="p-1">{item.com_full ? resumoGeo(item.com_full) : "—"}</td>
                <td className="p-1">{item.categoria_atual ?? "—"}</td>
                <td className="p-1">{item.final.classificacao.category_name}</td>
                <td className="p-1">{item.importance_atual ?? "—"}</td>
                <td className="p-1">{item.final.classificacao.importance_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PipelinePreviewDialog({
  open,
  onOpenChange,
  projectId,
  newsIds,
}: PipelinePreviewDialogProps) {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoPreviewLote | null>(null);
  const chave = newsIds.slice(0, 10).join(",");

  useEffect(() => {
    if (!open || !projectId || chave === "") return;
    let ativo = true;
    setCarregando(true);
    setErro(null);
    setResultado(null);
    previewPipelineServer({ data: { project_id: projectId, news_ids: chave.split(",") } })
      .then((r) => {
        if (ativo) setResultado(r);
      })
      .catch((e: unknown) => {
        if (ativo) setErro(e instanceof Error ? e.message : "Erro no preview.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [open, projectId, chave]);

  const unico = resultado?.itens.length === 1 ? resultado.itens[0] : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview do processamento</DialogTitle>
          <DialogDescription>
            Diagnóstico somente leitura — nada é gravado no banco.
          </DialogDescription>
        </DialogHeader>

        {carregando ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Executando pipeline em memória...
          </div>
        ) : erro ? (
          <p className="py-6 text-sm text-destructive">{erro}</p>
        ) : unico ? (
          <DetalhePreview item={unico} />
        ) : resultado ? (
          <TabelaPreview resultado={resultado} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
