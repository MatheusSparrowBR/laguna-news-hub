import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { formatarDataHora } from "@/lib/format";
import type { NewsItem } from "@/lib/types";

interface NewsCardProps {
  noticia: NewsItem;
}

export function NewsCard({ noticia }: NewsCardProps) {
  return (
    <Link
      to="/news/$id"
      params={{ id: noticia.id }}
      className="group block rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="truncate text-sm font-medium text-foreground group-hover:text-primary">
              {noticia.titulo}
            </h4>
            {noticia.isDemo !== undefined && (
              <Badge
                variant="outline"
                className={noticia.isDemo
                  ? "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400 text-[10px] px-1.5 py-0"
                  : "border-green-300 text-green-700 dark:border-green-700 dark:text-green-400 text-[10px] px-1.5 py-0"
                }
              >
                {noticia.isDemo ? "Demo" : "Real"}
              </Badge>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">{noticia.resumo}</p>
        </div>
        <StatusBadge status={noticia.status} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <CategoryBadge categoria={noticia.categoria} />
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {formatarDataHora(noticia.horario)}
        </span>
        <span className="ml-auto text-xs opacity-70">{noticia.fonte}</span>
      </div>
    </Link>
  );
}
