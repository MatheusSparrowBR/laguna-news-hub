import { cn } from "@/lib/utils";

/** Mostra a confiança simulada da IA (0 a 100). */
export function ConfidenceBadge({
  valor,
  className,
}: {
  valor: number;
  className?: string;
}) {
  const estilo =
    valor >= 85
      ? "bg-success-soft text-success border-success/25"
      : valor >= 70
        ? "bg-warning-soft text-warning-foreground border-warning/30"
        : "bg-destructive-soft text-destructive border-destructive/25";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums",
        estilo,
        className,
      )}
    >
      {valor}%
    </span>
  );
}
