import { cn } from "@/lib/utils";
import type { Categoria } from "@/lib/types";

const estilos: Record<Categoria, string> = {
  Urgente: "bg-destructive-soft text-destructive border-destructive/25",
  Trânsito: "bg-warning-soft text-warning-foreground border-warning/30",
  Segurança: "bg-destructive-soft text-destructive border-destructive/20",
  Prefeitura: "bg-primary-soft text-primary border-primary/20",
  Cidade: "bg-secondary text-secondary-foreground border-border",
  Eventos: "bg-primary-soft text-primary border-primary/20",
  Turismo: "bg-success-soft text-success border-success/20",
  Clima: "bg-warning-soft text-warning-foreground border-warning/30",
  Esportes: "bg-success-soft text-success border-success/20",
  Economia: "bg-secondary text-secondary-foreground border-border",
  Educação: "bg-primary-soft text-primary border-primary/20",
  Saúde: "bg-success-soft text-success border-success/20",
};

export function CategoryBadge({
  categoria,
  className,
}: {
  categoria: Categoria;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        estilos[categoria],
        className,
      )}
    >
      {categoria}
    </span>
  );
}
