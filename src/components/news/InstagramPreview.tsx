import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { NOME_DO_PERFIL } from "@/config/app";
import { formatarNumero } from "@/lib/format";
import type { Categoria } from "@/lib/types";
import { ArtePreview } from "./ArtePreview";

/** Mockup de como a publicação apareceria no Instagram. Apenas pré-visualização. */
export function InstagramPreview({
  categoria,
  titulo,
  legenda,
  hashtags,
  textoArte,
  curtidas,
  comentarios,
}: {
  categoria: Categoria;
  titulo: string;
  legenda: string;
  hashtags: string;
  textoArte: string;
  curtidas: number;
  comentarios: number;
}) {
  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          NL
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{NOME_DO_PERFIL}</p>
          <p className="text-xs text-muted-foreground">Laguna - SC</p>
        </div>
      </div>

      <ArtePreview categoria={categoria} texto={textoArte} className="rounded-none" />

      <div className="px-4 py-3">
        <div className="flex items-center gap-4 text-muted-foreground">
          <Heart className="size-5" />
          <MessageCircle className="size-5" />
          <Send className="size-5" />
          <Bookmark className="ml-auto size-5" />
        </div>
        <p className="mt-2 text-sm font-semibold text-foreground">
          {formatarNumero(curtidas)} curtidas
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">
          <span className="font-semibold">{NOME_DO_PERFIL}</span>{" "}
          <span className="font-medium">{titulo}</span>
        </p>
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {legenda}
        </p>
        {hashtags && <p className="mt-1 text-sm text-primary">{hashtags}</p>}
        <p className="mt-2 text-xs text-muted-foreground">
          Ver todos os {formatarNumero(comentarios)} comentários
        </p>
      </div>

      <p className="border-t border-border bg-secondary px-4 py-2 text-center text-xs text-muted-foreground">
        Pré-visualização simulada — nada é enviado ao Instagram nesta etapa.
      </p>
    </div>
  );
}
