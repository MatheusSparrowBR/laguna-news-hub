import { useSyncExternalStore } from "react";
import { mockNews } from "@/data/mock";
import type { ConteudoGerado, NewsItem, NewsStatus } from "@/lib/types";

/**
 * @deprecated Este store local será removido quando toda a leitura/gravação
 * migrar para o Supabase via src/services/queries.ts.
 *
 * Motivo de existir: permite rodar o app em modo demonstração sem banco.
 * Não importe useNoticias/useNoticia daqui nos componentes de rota —
 * prefira os hooks de src/services/queries.ts que já fazem fallback.
 */

let noticias: NewsItem[] = [...mockNews].sort(
  (a, b) => new Date(b.horario).getTime() - new Date(a.horario).getTime(),
);

const ouvintes = new Set<() => void>();

function notificar() {
  noticias = [...noticias];
  ouvintes.forEach((fn) => fn());
}

function inscrever(fn: () => void) {
  ouvintes.add(fn);
  return () => {
    ouvintes.delete(fn);
  };
}

/** @deprecated Use useNoticias de src/services/queries.ts */
export function useNoticiasLocal(): NewsItem[] {
  return useSyncExternalStore(
    inscrever,
    () => noticias,
    () => noticias,
  );
}

/** @deprecated Use useNoticia de src/services/queries.ts */
export function useNoticiaLocal(id: string): NewsItem | undefined {
  const lista = useNoticiasLocal();
  return lista.find((n) => n.id === id);
}

// Mantém exports antigos para compatibilidade durante a migração
export { useNoticiasLocal as useNoticias };
export { useNoticiaLocal as useNoticia };

export function alterarStatus(id: string, status: NewsStatus): void {
  noticias = noticias.map((n) => (n.id === id ? { ...n, status } : n));
  notificar();
}

export function salvarConteudo(id: string, gerado: ConteudoGerado): void {
  noticias = noticias.map((n) => (n.id === id ? { ...n, gerado } : n));
  notificar();
}

/** Simula uma nova coleta nas fontes cadastradas. */
export function recarregarNoticias(): void {
  noticias = [...noticias];
  notificar();
}
