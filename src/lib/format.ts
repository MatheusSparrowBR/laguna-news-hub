export function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarNumero(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

export function ehHoje(iso: string): boolean {
  const d = new Date(iso);
  const hoje = new Date();
  return d.toDateString() === hoje.toDateString();
}
