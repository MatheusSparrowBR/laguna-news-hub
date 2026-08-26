import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  titulo: string;
  valor: string | number;
  icone: LucideIcon;
  descricao?: string;
  variacao?: number;
  destaque?: "padrao" | "alerta" | "urgente";
}

export function MetricCard({
  titulo,
  valor,
  icone: Icone,
  descricao,
  variacao,
  destaque = "padrao",
}: MetricCardProps) {
  const iconeBg = {
    padrao: "bg-primary-soft text-primary",
    alerta: "bg-warning-soft text-warning-foreground",
    urgente: "bg-destructive-soft text-destructive",
  }[destaque];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
        <span className={cn("flex size-9 items-center justify-center rounded-lg", iconeBg)}>
          <Icone className="size-4.5" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">
        {valor}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {typeof variacao === "number" && (
          <span
            className={cn(
              "text-xs font-semibold",
              variacao >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {variacao >= 0 ? "+" : ""}
            {variacao}%
          </span>
        )}
        {descricao && <span className="text-xs text-muted-foreground">{descricao}</span>}
      </div>
    </div>
  );
}
