/**
 * Serviço de dados mock. Centraliza o acesso aos dados simulados
 * para facilitar a troca futura por Supabase.
 */
import {
  mockDailyMetrics,
  mockInstagramStats,
  mockNews,
  mockPublications,
  mockSources,
} from "@/data/mock";
import type { DailyMetric, NewsItem, Publication, Source } from "@/lib/types";

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
  return [...mockSources];
}

export function obterMetricasDiarias(): DailyMetric[] {
  return mockDailyMetrics;
}

export function obterEstatisticasInstagram() {
  return mockInstagramStats;
}
