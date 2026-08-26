import type { NewsItem, PeriodoFiltro } from "./types";

export interface NewsFilterState {
  busca: string;
  status: string;
  categoria: string;
  importancia: string;
  fonte: string;
  periodo: PeriodoFiltro;
  dataInicio: string;
  dataFim: string;
}

export const filtrosIniciais: NewsFilterState = {
  busca: "",
  status: "todos",
  categoria: "todas",
  importancia: "todas",
  fonte: "todas",
  periodo: "todos",
  dataInicio: "",
  dataFim: "",
};

function dentroDoPeriodo(iso: string, f: NewsFilterState): boolean {
  const data = new Date(iso);
  const agora = new Date();

  if (f.periodo === "hoje") {
    return data.toDateString() === agora.toDateString();
  }
  if (f.periodo === "24h") {
    return agora.getTime() - data.getTime() <= 24 * 60 * 60 * 1000;
  }
  if (f.periodo === "7dias") {
    return agora.getTime() - data.getTime() <= 7 * 24 * 60 * 60 * 1000;
  }
  if (f.periodo === "personalizado") {
    if (f.dataInicio && data < new Date(`${f.dataInicio}T00:00:00`)) return false;
    if (f.dataFim && data > new Date(`${f.dataFim}T23:59:59`)) return false;
    return true;
  }
  return true;
}

export function filtrarNoticias(lista: NewsItem[], f: NewsFilterState): NewsItem[] {
  const busca = f.busca.trim().toLowerCase();
  return lista.filter((n) => {
    if (busca && !`${n.titulo} ${n.resumo}`.toLowerCase().includes(busca)) return false;
    if (f.status !== "todos" && n.status !== f.status) return false;
    if (f.categoria !== "todas" && n.categoria !== f.categoria) return false;
    if (f.importancia !== "todas" && n.importancia !== f.importancia) return false;
    if (f.fonte !== "todas" && n.fonte !== f.fonte) return false;
    return dentroDoPeriodo(n.horario, f);
  });
}

export function contarFiltrosAtivos(f: NewsFilterState): number {
  let total = 0;
  if (f.status !== "todos") total++;
  if (f.categoria !== "todas") total++;
  if (f.importancia !== "todas") total++;
  if (f.fonte !== "todas") total++;
  if (f.periodo !== "todos") total++;
  return total;
}
