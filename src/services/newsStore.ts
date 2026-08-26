import { useSyncExternalStore } from "react";
import { mockNews } from "@/data/mock";
import type { ConteudoGerado, NewsItem, NewsStatus } from "@/lib/types";

/**
 * Estado simulado das notícias (em memória, apenas nesta etapa do projeto).
 * Quando o Supabase entrar, estas funções passarão a ler/gravar no banco
 * e as telas continuam iguais.
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
  return () => ouvintes.delete(fn);
}

export function useNoticias(): NewsItem[] {
  return useSyncExternalStore(
    inscrever,
    () => noticias,
    () => noticias,
  );
}

export function useNoticia(id: string): NewsItem | undefined {
  const lista = useNoticias();
  return lista.find((n) => n.id === id);
}

export function alterarStatus(id: string, status: NewsStatus) {
  noticias = noticias.map((n) => (n.id === id ? { ...n, status } : n));
  notificar();
}

export function salvarConteudo(id: string, gerado: ConteudoGerado) {
  noticias = noticias.map((n) => (n.id === id ? { ...n, gerado } : n));
  notificar();
}

/** Simula uma nova coleta nas fontes cadastradas. */
export function recarregarNoticias() {
  noticias = [...noticias];
  notificar();
}
