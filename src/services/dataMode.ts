import { useSyncExternalStore } from "react";

/**
 * Modo de dados do painel.
 * - "banco": usa o Lovable Cloud (fonte principal).
 * - "demo": usa os dados simulados que já existiam, para demonstração.
 */
export type ModoDados = "banco" | "demo";

const CHAVE = "laguna:modo-dados";
const ouvintes = new Set<() => void>();
let modo: ModoDados = "banco";
let carregado = false;

function carregar(): ModoDados {
  if (!carregado && typeof window !== "undefined") {
    const salvo = window.localStorage.getItem(CHAVE);
    modo = salvo === "demo" ? "demo" : "banco";
    carregado = true;
  }
  return modo;
}

export function definirModoDados(novo: ModoDados) {
  modo = novo;
  carregado = true;
  if (typeof window !== "undefined") window.localStorage.setItem(CHAVE, novo);
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
