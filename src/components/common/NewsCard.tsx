import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategoryBadge } from "./CategoryBadge";
import { StatusBadge } from "./StatusBadge";
import { formatarDataHora } from "@/lib/format";
import type { NewsItem } from "@/lib/types";

interface Props {
  noticia: NewsItem;
}

export function NewsCard({ noticia }: Props) {
  const isDemo = (noticia as any).isDemo;

  return (
    <Link
      to="/news/$id"
      params={{ id: noticia.id }}
      className="block rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="truncate text-sm font-medium text-foreground">
              {noticia.titulo}
            </h4>
            {isDemo === true && (
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0 shrink-0">
                Demo
              </Badge>
            )}
            {isDemo === false && (
              <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 text-[10px] px-1.5 py-0 shrink-0">
                Real
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{noticia.fonte}</span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {formatarDataHora(noticia.horario)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <CategoryBadge categoria={noticia.categoria} />
          <StatusBadge status={noticia.status} />
        </div>
      </div>
    </Link>
  );
}
