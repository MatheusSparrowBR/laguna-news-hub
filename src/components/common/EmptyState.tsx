import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  titulo,
  descricao,
  icone: Icone = Inbox,
  acao,
}: {
  titulo: string;
  descricao?: string;
  icone?: LucideIcon;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icone className="size-6" />
      </span>
      <h3 className="mt-4 font-display text-base font-semibold text-foreground">{titulo}</h3>
      {descricao && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{descricao}</p>
      )}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}
