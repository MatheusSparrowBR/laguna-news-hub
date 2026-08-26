import { Link } from "@tanstack/react-router";
import {
  Check,
  Copy,
  EyeOff,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Pencil,
  Send,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NewsItem } from "@/lib/types";

export interface NewsActionHandlers {
  onAprovar: (noticia: NewsItem) => void;
  onIgnorar: (noticia: NewsItem) => void;
  onPublicar: (noticia: NewsItem) => void;
  onRejeitar: (noticia: NewsItem) => void;
  onCopiarLegenda: (noticia: NewsItem) => void;
}

/** Ações de uma notícia na listagem. */
export function NewsActions({
  noticia,
  handlers,
  compacto = false,
}: {
  noticia: NewsItem;
  handlers: NewsActionHandlers;
  compacto?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="ghost" size="sm" title="Visualizar">
        <Link to="/news/$id" params={{ id: noticia.id }}>
          <Eye className="size-4" />
          {compacto && <span>Visualizar</span>}
        </Link>
      </Button>

      {!compacto && (
        <>
          <Button asChild variant="ghost" size="sm" title="Editar conteúdo">
            <Link to="/news/$id" params={{ id: noticia.id }} hash="conteudo">
              <Pencil className="size-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Aprovar"
            onClick={() => handlers.onAprovar(noticia)}
          >
            <Check className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Ignorar"
            onClick={() => handlers.onIgnorar(noticia)}
          >
            <EyeOff className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Publicar agora"
            onClick={() => handlers.onPublicar(noticia)}
          >
            <Send className="size-4" />
          </Button>
        </>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" title="Mais opções">
            <MoreHorizontal className="size-4" />
            {compacto && <span>Mais</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {compacto && (
            <>
              <DropdownMenuItem onClick={() => handlers.onAprovar(noticia)}>
                <Check className="size-4" />
                Aprovar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlers.onPublicar(noticia)}>
                <Send className="size-4" />
                Publicar agora
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlers.onIgnorar(noticia)}>
                <EyeOff className="size-4" />
                Ignorar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => handlers.onCopiarLegenda(noticia)}>
            <Copy className="size-4" />
            Copiar legenda
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={noticia.url} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              Abrir fonte original
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => handlers.onRejeitar(noticia)}
          >
            <Ban className="size-4" />
            Rejeitar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
