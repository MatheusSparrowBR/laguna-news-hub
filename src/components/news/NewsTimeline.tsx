import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatarDataHora } from "@/lib/format";
import type { EtapaHistorico } from "@/lib/newsFlow";

/** Timeline do fluxo editorial (horários simulados). */
export function NewsTimeline({ etapas }: { etapas: EtapaHistorico[] }) {
  return (
    <ol className="space-y-0">
      {etapas.map((etapa, i) => (
        <li key={etapa.titulo} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                etapa.concluida
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-secondary text-muted-foreground",
              )}
            >
              {etapa.concluida ? <Check className="size-3.5" /> : i + 1}
            </span>
            {i < etapas.length - 1 && (
              <span
                className={cn(
                  "w-px flex-1",
                  etapa.concluida ? "bg-primary/30" : "bg-border",
                )}
              />
            )}
          </div>
          <div className={cn("pb-5", i === etapas.length - 1 && "pb-0")}>
            <p
              className={cn(
                "text-sm font-medium",
                etapa.concluida ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {etapa.titulo}
            </p>
            <p className="text-xs text-muted-foreground">{etapa.descricao}</p>
            <p className="mt-0.5 text-xs text-muted-foreground/80">
              {etapa.concluida ? formatarDataHora(etapa.horario) : "Pendente"}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
