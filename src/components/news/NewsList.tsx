import { Link } from "@tanstack/react-router";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { NewsActions, type NewsActionHandlers } from "./NewsActions";
import { formatarDataHora } from "@/lib/format";
import type { NewsItem } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Listagem de notícias: tabela no desktop e cards no mobile. */
export function NewsList({
  noticias,
  handlers,
}: {
  noticias: NewsItem[];
  handlers: NewsActionHandlers;
}) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-card lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Notícia</TableHead>
              <TableHead>Data / hora</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Importância</TableHead>
              <TableHead>Confiança IA</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {noticias.map((n) => (
              <TableRow key={n.id}>
                <TableCell className="max-w-sm">
                  <Link
                    to="/news/$id"
                    params={{ id: n.id }}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {n.titulo}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.fonte}</p>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatarDataHora(n.horario)}
                </TableCell>
                <TableCell>
                  <CategoryBadge categoria={n.categoria} />
                </TableCell>
                <TableCell>
                  <StatusBadge tipo="importancia" valor={n.importancia} />
                </TableCell>
                <TableCell>
                  <ConfidenceBadge valor={n.confiancaIA} />
                </TableCell>
                <TableCell>
                  <StatusBadge tipo="noticia" valor={n.status} />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <NewsActions noticia={n} handlers={handlers} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <div className="space-y-3 lg:hidden">
        {noticias.map((n) => (
          <article
            key={n.id}
            className="rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge categoria={n.categoria} />
              <StatusBadge tipo="noticia" valor={n.status} />
            </div>
            <Link
              to="/news/$id"
              params={{ id: n.id }}
              className="mt-2 block font-display text-base font-semibold leading-snug text-foreground"
            >
              {n.titulo}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">
              {n.fonte} · {formatarDataHora(n.horario)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge tipo="importancia" valor={n.importancia} />
              <ConfidenceBadge valor={n.confiancaIA} />
            </div>
            <div className="mt-3 border-t border-border pt-2">
              <NewsActions noticia={n} handlers={handlers} compacto />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
