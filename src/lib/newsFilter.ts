import type { NewsItem } from "./types";

export interface FiltrosNoticia {
  busca: string;
  status?: string | undefined;
  categoria?: string | undefined;
  importancia?: string | undefined;
  fonte?: string | undefined;
}

export const filtrosIniciais: FiltrosNoticia = {
  busca: "",
};

export function filtrarNoticias(
  noticias: NewsItem[],
  filtros: FiltrosNoticia,
): NewsItem[] {
  return noticias.filter((n) => {
    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      const match =
        n.titulo.toLowerCase().includes(termo) ||
        n.resumo.toLowerCase().includes(termo) ||
        n.gerado.titulo.toLowerCase().includes(termo);
      if (!match) return false;
    }
    if (filtros.status && n.status !== filtros.status) return false;
    if (filtros.categoria && n.categoria !== filtros.categoria) return false;
    if (filtros.importancia && n.importancia !== filtros.importancia) return false;
    if (filtros.fonte && n.fonte !== filtros.fonte) return false;
    return true;
  });
}
