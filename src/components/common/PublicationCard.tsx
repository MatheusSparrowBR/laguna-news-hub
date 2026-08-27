import { Eye, Heart, MessageCircle } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { CategoryBadge } from "./CategoryBadge";
import type { Publication } from "@/lib/types";
import { formatarHora, formatarNumero } from "@/lib/format";

export function PublicationCard({ publicacao }: { publicacao: Publication }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium text-foreground">
          {publicacao.titulo}
        </p>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
          {publicacao.legenda}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={publicacao.status} />
          <CategoryBadge categoria={publicacao.categoria} />
          <span className="text-xs text-muted-foreground">{formatarHora(publicacao.horario)}</span>
        </div>
        {publicacao.status === "publicada" && (
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Eye className="size-3" />
              {formatarNumero(publicacao.visualizacoes)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart className="size-3" />
              {formatarNumero(publicacao.curtidas)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="size-3" />
              {publicacao.comentarios}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
