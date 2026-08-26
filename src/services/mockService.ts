import {
  mockDailyMetrics,
  mockInstagramStats,
  mockNews,
  mockPublications,
  mockSources,
} from "@/data/mock";
import type { NewsItem, Publication, Source } from "@/lib/types";

/**
 * Camada de serviço. Hoje devolve dados simulados; no futuro cada função
 * passará a consultar o Supabase, sem precisar alterar as telas.
 */

export function listarNoticias(): NewsItem[] {
  return [...mockNews].sort(
    (a, b) => new Date(b.horario).getTime() - new Date(a.horario).getTime(),
  );
}

export function obterNoticia(id: string): NewsItem | undefined {
  return mockNews.find((n) => n.id === id);
}

export function listarPublicacoes(): Publication[] {
  return [...mockPublications].sort(
    (a, b) => new Date(b.horario).getTime() - new Date(a.horario).getTime(),
  );
}

export function listarFontes(): Source[] {
  return mockSources;
}

export function obterMetricasDiarias() {
  return mockDailyMetrics;
}

export function obterEstatisticasInstagram() {
  return mockInstagramStats;
}
