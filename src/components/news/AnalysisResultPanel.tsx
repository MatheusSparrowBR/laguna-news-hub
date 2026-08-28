import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, AlertTriangle, XCircle, MapPin, Brain } from "lucide-react";
import type { AnalysisData } from "@/services/analyzeNews";

interface AnalysisResultPanelProps {
  analysis: AnalysisData;
  newStatus: string;
}

function ModerationBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle2 className="size-3 mr-1" />
          Aprovada
        </Badge>
      );
    case "review_required":
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-300">
          <AlertTriangle className="size-3 mr-1" />
          Revisão necessária
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-100 text-red-800 border-red-300">
          <XCircle className="size-3 mr-1" />
          Rejeitada
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function RelevanceBadge({ relevant }: { relevant: boolean }) {
  if (relevant) {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-300">
        <MapPin className="size-3 mr-1" />
        Relevante para Laguna
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-600 border-gray-300">
      <MapPin className="size-3 mr-1" />
      Não relevante para Laguna
    </Badge>
  );
}

function ConfidenceIndicator({ value }: { value: number }) {
  let color = "text-red-600";
  let label = "Baixa";
  if (value >= 95) {
    color = "text-green-600";
    label = "Alta";
  } else if (value >= 80) {
    color = "text-amber-600";
    label = "Média";
  }
  return (
    <span className={`font-bold ${color}`}>
      {value}% ({label})
    </span>
  );
}

export function AnalysisResultPanel({ analysis, newStatus }: AnalysisResultPanelProps) {
  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="size-5 text-blue-600" />
          Resultado da Análise de IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status badges */}
        <div className="flex flex-wrap items-center gap-2">
          <RelevanceBadge relevant={analysis.is_relevant_to_laguna} />
          <ModerationBadge status={analysis.moderation_status} />
          <Badge variant="outline">Status: {newStatus}</Badge>
        </div>

        {/* Metrics */}
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-background p-3 text-center">
            <p className="text-xs text-muted-foreground">Confiança</p>
            <p className="text-lg font-bold">
              <ConfidenceIndicator value={analysis.relevance_confidence} />
            </p>
          </div>
          <div className="rounded-lg border bg-background p-3 text-center">
            <p className="text-xs text-muted-foreground">Categoria</p>
            <p className="text-sm font-semibold text-foreground">{analysis.category}</p>
          </div>
          <div className="rounded-lg border bg-background p-3 text-center">
            <p className="text-xs text-muted-foreground">Importância</p>
            <p className="text-lg font-bold text-foreground">{analysis.importance_score}/10</p>
          </div>
          <div className="rounded-lg border bg-background p-3 text-center">
            <p className="text-xs text-muted-foreground">Relevante</p>
            <p className="text-lg font-bold text-foreground">{analysis.is_relevant_to_laguna ? "Sim" : "Não"}</p>
          </div>
        </div>

        <Separator />

        {/* Summary */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Resumo</h4>
          <p className="mt-1 text-sm text-foreground">{analysis.summary}</p>
        </div>

        <Separator />

        {/* Instagram content */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Título para Instagram</h4>
          <p className="mt-1 font-medium text-foreground">{analysis.instagram_title}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Legenda para Instagram</h4>
          <p className="mt-1 text-sm whitespace-pre-line text-foreground">{analysis.instagram_caption}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Hashtags</h4>
          <p className="mt-1 text-sm text-primary">{analysis.hashtags}</p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Texto sugerido para arte</h4>
          <p className="mt-1 text-sm text-foreground">{analysis.suggested_art_text}</p>
        </div>

        <Separator />

        {/* Moderation explanation */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
          <h4 className="text-sm font-medium text-amber-800">Por que esta notícia foi classificada assim?</h4>
          <p className="mt-1 text-sm text-amber-900">{analysis.moderation_notes}</p>
        </div>
      </CardContent>
    </Card>
  );
}
