import { Link } from "@tanstack/react-router";
import { Clock, Radio } from "lucide-react";
import type { NewsItem } from "@/lib/types";
import { formatarHora } from "@/lib/format";
import { CategoryBadge } from "./CategoryBadge";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

export function NewsCard({ noticia }: { noticia: NewsItem }) {
  const urgente = noticia.importancia === "urgente";

  return (
    <Link
      to="/news/$id"
      params={{ id: noticia.id }}
      className={cn(
        "block rounded-xl border bg-card p-4 shadow-card transition-shadow hover:shadow-elevated",
        urgente ? "border-destructive/40" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge categoria={noticia.categoria} />
        <StatusBadge tipo="noticia" valor={noticia.status} />
        <StatusBadge tipo="importancia" valor={noticia.importancia} />
      </div>
      <h3 className="mt-3 font-display text-base font-semibold leading-snug text-foreground">
        {noticia.titulo}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{noticia.resumo}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Radio className="size-3.5" />
          {noticia.fonte}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {formatarHora(noticia.horario)}
        </span>
      </div>
    </Link>
  );
}
