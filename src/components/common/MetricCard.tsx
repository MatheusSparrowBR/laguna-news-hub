import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  titulo: string;
  valor: string | number;
  icone: LucideIcon;
  descricao?: string;
  variacao?: number;
  destaque?: "alerta" | "urgente";
}

export function MetricCard({
  titulo,
  valor,
  icone: Icone,
  descricao,
  variacao,
  destaque,
}: MetricCardProps) {
  return (
    <Card
      className={`transition-shadow hover:shadow-md ${
        destaque === "urgente"
          ? "border-red-200 dark:border-red-800"
          : destaque === "alerta"
            ? "border-amber-200 dark:border-amber-800"
            : ""
      }`}
    >
      <CardContent className="flex items-start gap-3 pt-5">
        <div
          className={`rounded-lg p-2.5 ${
            destaque === "urgente"
              ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
              : destaque === "alerta"
                ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                : "bg-primary/10 text-primary"
          }`}
        >
          <Icone className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">{titulo}</p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight text-foreground">{valor}</p>
          {descricao && (
            <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p>
          )}
          {variacao !== undefined && (
            <p
              className={`mt-0.5 text-xs font-medium ${
                variacao >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {variacao >= 0 ? "+" : ""}
              {variacao}%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
