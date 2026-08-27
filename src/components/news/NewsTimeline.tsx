import { CheckCircle2, Circle, Clock } from "lucide-react";
import type { NewsItem } from "@/lib/types";
import { formatarDataHora } from "@/lib/format";

const etapasFluxo = [
  { status: "nova", label: "Encontrada" },
  { status: "em_analise", label: "Em análise pela IA" },
  { status: "aguardando_aprovacao", label: "Aguardando aprovação" },
  { status: "aprovada", label: "Aprovada" },
  { status: "publicada", label: "Publicada" },
] as const;

const statusOrdem: Record<string, number> = {
  nova: 0,
  em_analise: 1,
  aguardando_aprovacao: 2,
  revisao_obrigatoria: 2,
  aprovada: 3,
  publicada: 4,
  ignorada: -1,
  rejeitada: -1,
  duplicada: -1,
};

export function NewsTimeline({ noticia }: { noticia: NewsItem }) {
  const ordemAtual = statusOrdem[noticia.status] ?? -1;

  if (ordemAtual === -1) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Circle className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Encontrada em {formatarDataHora(noticia.horario)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-amber-500" />
          <span className="text-sm font-medium text-foreground capitalize">
            {noticia.status.replace("_", " ")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {etapasFluxo.map((etapa, i) => {
        const concluida = i < ordemAtual;
        const atual = i === ordemAtual;

        return (
          <div key={etapa.status} className="flex items-center gap-3">
            {concluida ? (
              <CheckCircle2 className="size-4 shrink-0 text-green-500" />
            ) : atual ? (
              <Clock className="size-4 shrink-0 text-primary" />
            ) : (
              <Circle className="size-4 shrink-0 text-muted-foreground/40" />
            )}
            <span
              className={`text-sm ${
                concluida
                  ? "text-muted-foreground line-through"
                  : atual
                    ? "font-medium text-foreground"
                    : "text-muted-foreground/60"
              }`}
            >
              {etapa.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
