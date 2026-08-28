import { useSyncExternalStore } from "react";

/**
 * Modo de dados do painel.
 * - "banco": usa o Supabase como fonte de dados.
 * - "demo": usa os dados simulados (desativado — mantido apenas por compatibilidade de tipo).
 */
export type ModoDados = "banco" | "demo";

const CHAVE = "laguna:modo-dados";
const ouvintes = new Set<() => void>();
let modo: ModoDados = "banco";
let carregado = false;

function carregar(): ModoDados {
  if (!carregado && typeof window !== "undefined") {
    // Sempre usa banco (Supabase). Ignora valor salvo.
    modo = "banco";
    carregado = true;
  }
  return modo;
}

export function definirModoDados(novo: ModoDados) {
  // Força sempre banco — ignora tentativa de mudar para demo
  modo = "banco";
  carregado = true;
  if (typeof window !== "undefined") window.localStorage.setItem(CHAVE, "banco");
  ouvintes.forEach((o) => o());
}

function inscrever(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

export function useModoDados(): ModoDados {
  return useSyncExternalStore(
    inscrever,
    () => carregar(),
    () => "banco" as ModoDados,
  );
}
