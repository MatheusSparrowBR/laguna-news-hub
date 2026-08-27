import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { CategoryBadge } from "./CategoryBadge";
import type { NewsItem } from "@/lib/types";
import { formatarHora } from "@/lib/format";

export function NewsCard({ noticia }: { noticia: NewsItem }) {
  return (
    <Link
      to="/news/$id"
      params={{ id: noticia.id }}
      className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
    >
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium text-foreground group-hover:text-primary">
          {noticia.gerado.titulo || noticia.titulo}
        </p>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{noticia.resumo}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={noticia.status} />
          <CategoryBadge categoria={noticia.categoria} />
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {formatarHora(noticia.horario)}
          </span>
          <span className="text-xs text-muted-foreground">• {noticia.fonte}</span>
        </div>
      </div>
    </Link>
  );
}
