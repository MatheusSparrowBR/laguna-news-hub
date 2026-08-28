import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Globe,
  Rss,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { CollectNewsResult } from "@/services/collectNews";

interface CollectResultPanelProps {
  resultado: CollectNewsResult;
  executadoEm: string;
  projectId: string;
  totalFontesNoProjeto: number;
}

export function CollectResultPanel({
  resultado,
  executadoEm,
  projectId,
  totalFontesNoProjeto,
}: CollectResultPanelProps) {
  const avisos = gerarAvisos(resultado, totalFontesNoProjeto);

  const statusColor =
    resultado.status === "success"
      ? "text-green-600"
      : resultado.status === "error"
        ? "text-red-600"
        : "text-amber-600";

  const statusIcon =
    resultado.status === "success" ? (
      <CheckCircle2 className="size-4 text-green-600" />
    ) : resultado.status === "error" ? (
      <XCircle className="size-4 text-red-600" />
    ) : (
      <AlertTriangle className="size-4 text-amber-600" />
    );

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Database className="size-4" />
          Resultado da última coleta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Resumo geral */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            icon={statusIcon}
            label="Status"
            value={resultado.status}
            valueClass={statusColor}
          />
          <InfoItem
            icon={<Clock className="size-4 text-muted-foreground" />}
            label="Horário da execução"
            value={formatDateTime(executadoEm)}
          />
          <InfoItem
            icon={<Database className="size-4 text-muted-foreground" />}
            label="Project ID utilizado"
            value={projectId}
            mono
          />
          <InfoItem
            icon={<Rss className="size-4 text-muted-foreground" />}
            label="Fontes associadas ao Project ID"
            value={String(totalFontesNoProjeto)}
          />
        </div>

        {/* Métricas numéricas */}
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricBox label="Fontes verificadas" value={resultado.sources_checked} />
          <MetricBox
            label="Fontes com erro"
            value={resultado.total_errors}
            alert={resultado.total_errors > 0}
          />
          <MetricBox label="Itens encontrados" value={resultado.total_found} />
          <MetricBox label="Itens novos" value={resultado.total_new} success={resultado.total_new > 0} />
          <MetricBox label="Itens duplicados" value={resultado.total_duplicate} />
          <MetricBox
            label="Itens ignorados"
            value={
              resultado.total_found - resultado.total_new - resultado.total_duplicate
            }
          />
        </div>

        {/* Erros gerais */}
        {resultado.total_errors > 0 && (
          <div className="text-sm">
            <span className="font-medium text-red-600">Erros:</span>{" "}
            <span className="text-muted-foreground">
              {resultado.total_errors} fonte(s) com erro durante a coleta.
            </span>
          </div>
        )}

        {/* Detalhes por fonte */}
        {resultado.logs.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">
              Detalhes por fonte ({resultado.logs.length})
            </h4>
            <Accordion type="multiple" className="w-full">
              {resultado.logs.map((log, idx) => (
                <AccordionItem key={log.source_id || idx} value={`fonte-${idx}`}>
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2">
                      {log.error ? (
                        <XCircle className="size-3.5 text-red-500" />
                      ) : (
                        <CheckCircle2 className="size-3.5 text-green-500" />
                      )}
                      <span className="font-medium">{log.source_name}</span>
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        {log.found} encontrados
                      </Badge>
                      {log.new > 0 && (
                        <Badge className="ml-1 text-[10px]">
                          +{log.new} novos
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <DetailRow label="Nome" value={log.source_name} />
                      {log.rss_url && (
                        <DetailRow label="RSS" value={log.rss_url} mono />
                      )}
                      <DetailRow
                        label="Status HTTP"
                        value={
                          log.error && log.error.startsWith("HTTP")
                            ? log.error
                            : log.error
                              ? "Erro"
                              : "200"
                        }
                        alert={!!log.error}
                      />
                      <DetailRow
                        label="Conteúdo recebido"
                        value={
                          log.error
                            ? "Erro"
                            : log.content_type === "html"
                              ? "HTML (esperado XML)"
                              : "XML"
                        }
                        alert={log.content_type === "html"}
                      />
                      <DetailRow label="Itens encontrados" value={String(log.found)} />
                      <DetailRow label="Novos" value={String(log.new)} />
                      <DetailRow label="Duplicados" value={String(log.duplicate)} />
                      {log.error && (
                        <div className="col-span-full">
                          <DetailRow label="Erro" value={log.error} alert />
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        {/* Avisos */}
        {avisos.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-amber-700">Avisos</h4>
            {avisos.map((aviso, idx) => (
              <Alert key={idx} variant="destructive" className="border-amber-300 bg-amber-50 text-amber-900">
                <AlertTriangle className="size-4 text-amber-600" />
                <AlertTitle className="text-xs font-semibold">{aviso.titulo}</AlertTitle>
                <AlertDescription className="text-xs">{aviso.descricao}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Sub-componentes internos ---

function InfoItem({
  icon,
  label,
  value,
  valueClass,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={`text-sm font-medium truncate ${
            mono ? "font-mono text-xs" : ""
          } ${valueClass ?? ""}`}
          title={value}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
  alert,
  success,
}: {
  label: string;
  value: number;
  alert?: boolean;
  success?: boolean;
}) {
  const valueColor = alert
    ? "text-red-600"
    : success
      ? "text-green-600"
      : "text-foreground";

  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <p className={`text-lg font-bold ${valueColor}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  alert,
}: {
  label: string;
  value: string;
  mono?: boolean;
  alert?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span
        className={`text-xs break-all ${
          mono ? "font-mono" : ""
        } ${alert ? "text-red-600 font-medium" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}

// --- Helpers ---

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

interface Aviso {
  titulo: string;
  descricao: string;
}

function gerarAvisos(
  resultado: CollectNewsResult,
  totalFontesNoProjeto: number,
): Aviso[] {
  const avisos: Aviso[] = [];

  if (resultado.sources_checked === 0) {
    avisos.push({
      titulo: "Nenhuma fonte encontrada para o project_id",
      descricao:
        "A coleta não encontrou fontes ativas com RSS configurado para este projeto. Verifique se as fontes estão ativas e possuem rss_url preenchido.",
    });
  }

  for (const log of resultado.logs) {
    if (log.rss_url === "" || log.rss_url === null || log.rss_url === undefined) {
      avisos.push({
        titulo: `rss_url vazia: ${log.source_name}`,
        descricao: "Esta fonte não possui URL de RSS configurada.",
      });
    }

    if (log.content_type === "html") {
      avisos.push({
        titulo: `RSS retornou HTML: ${log.source_name}`,
        descricao:
          "O servidor retornou HTML ao invés de XML. A URL pode estar incorreta ou o feed foi desativado.",
      });
    }

    if (log.error && log.error.startsWith("HTTP")) {
      avisos.push({
        titulo: `Status HTTP diferente de 200: ${log.source_name}`,
        descricao: log.error,
      });
    }

    if (!log.error && log.found === 0) {
      avisos.push({
        titulo: `Parser encontrou 0 itens: ${log.source_name}`,
        descricao:
          "O feed foi lido com sucesso mas nenhum item foi extraído. O formato pode ser incompatível.",
      });
    }

    if (log.found > 0 && log.found === log.duplicate && log.new === 0) {
      avisos.push({
        titulo: `Todos os itens são duplicados: ${log.source_name}`,
        descricao: `${log.duplicate} item(s) encontrado(s), mas todos já existem no banco.`,
      });
    }

    if (log.insert_errors && log.insert_errors > 0) {
      avisos.push({
        titulo: `Insert no banco falhou: ${log.source_name}`,
        descricao: `${log.insert_errors} tentativa(s) de insert falharam.`,
      });
    }
  }

  // Fontes inativas ou sem RSS (detectado pelo total no projeto vs fontes verificadas)
  if (totalFontesNoProjeto > resultado.sources_checked) {
    const inativas = totalFontesNoProjeto - resultado.sources_checked;
    avisos.push({
      titulo: `${inativas} fonte(s) não verificada(s)`,
      descricao:
        "Algumas fontes estão inativas ou sem rss_url. Elas não participaram da coleta.",
    });
  }

  return avisos;
}
