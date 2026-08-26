import { Clock, Eye, Heart, MessageCircle } from "lucide-react";
import type { Publication } from "@/lib/types";
import { formatarHora, formatarNumero } from "@/lib/format";
import { CategoryBadge } from "./CategoryBadge";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";

export function PublicationCard({
  publicacao,
  onVisualizar,
}: {
  publicacao: Publication;
  onVisualizar?: (p: Publication) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Clock className="size-3.5" />
          {formatarHora(publicacao.horario)}
        </span>
        <CategoryBadge categoria={publicacao.categoria} />
        <StatusBadge tipo="publicacao" valor={publicacao.status} />
      </div>
      <h3 className="mt-3 font-display text-base font-semibold leading-snug text-foreground">
        {publicacao.titulo}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{publicacao.legenda}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Eye className="size-3.5" />
            {formatarNumero(publicacao.visualizacoes)}
          </span>
          <span className="flex items-center gap-1.5">
            <Heart className="size-3.5" />
            {formatarNumero(publicacao.curtidas)}
          </span>
          <span className="flex items-center gap-1.5">
            <MessageCircle className="size-3.5" />
            {formatarNumero(publicacao.comentarios)}
          </span>
        </div>
        {onVisualizar && (
          <Button variant="outline" size="sm" onClick={() => onVisualizar(publicacao)}>
            Visualizar
          </Button>
        )}
      </div>
    </div>
  );
}
