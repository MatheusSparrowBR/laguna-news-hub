/**
 * Funções utilitárias de formatação.
 */

export function formatarNumero(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ehHoje(iso: string): boolean {
  const d = new Date(iso);
  const hoje = new Date();
  return (
    d.getDate() === hoje.getDate() &&
    d.getMonth() === hoje.getMonth() &&
    d.getFullYear() === hoje.getFullYear()
  );
}
