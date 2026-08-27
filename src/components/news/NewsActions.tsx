import type { NewsItem } from "@/lib/types";

export interface NewsActionHandlers {
  onAprovar: (noticia: NewsItem) => void;
  onIgnorar: (noticia: NewsItem) => void;
  onRejeitar: (noticia: NewsItem) => void;
  onPublicar: (noticia: NewsItem) => void;
  onCopiarLegenda: (noticia: NewsItem) => void;
}
