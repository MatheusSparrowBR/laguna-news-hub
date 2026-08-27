import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icone?: LucideIcon;
  titulo: string;
  descricao?: string;
}

export function EmptyState({ icone: Icone = Inbox, titulo, descricao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
      <Icone className="size-10 text-muted-foreground/50" />
      <h3 className="mt-3 text-sm font-medium text-foreground">{titulo}</h3>
      {descricao && (
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">{descricao}</p>
      )}
    </div>
  );
}
