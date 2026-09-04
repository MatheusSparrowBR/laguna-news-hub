/**
 * Templates de arte — definição declarativa, sem IA e sem serviço externo.
 *
 * PALETA OFICIAL HORA NEWS LAGUNA (única fonte de cor das artes):
 *   #0B3D91 azul principal · #1E6BB8 azul secundário · #FFC107 amarelo
 *   #F4F7FB fundo · #1F2937 texto · #FFFFFF branco (apenas contraste)
 *
 * Puro: sem DOM, sem rede, sem secrets.
 */

import type { TemplateKey } from "@/lib/templates/postTemplates";

export type ArtFormat = "feed" | "square" | "story";

export interface Dimensao {
  width: number;
  height: number;
}

export const DIMENSOES: Record<ArtFormat, Dimensao> = {
  feed: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
};

export const ROTULO_FORMATO: Record<ArtFormat, string> = {
  feed: "Feed 1080×1350",
  square: "Quadrado 1080×1080",
  story: "Story 1080×1920",
};

/* --------------------------------------------------------- paleta oficial */

export const MARCA = {
  primary: "#0B3D91",
  secondary: "#1E6BB8",
  accent: "#FFC107",
  background: "#F4F7FB",
  text: "#1F2937",
  white: "#FFFFFF",
} as const;

export interface ArtTheme {
  /** Rótulo do selo de categoria. */
  label: string;
  /** Cor do selo de categoria. */
  badge: string;
  /** Cor do texto do selo. */
  badgeText: string;
  /** Selo de urgência visível ("AGORA"). */
  urgent: boolean;
  /** Composição de foto máxima, com pouquíssimo texto. */
  minimal: boolean;
}

function tema(parcial: Partial<ArtTheme> & { label: string }): ArtTheme {
  return {
    badge: MARCA.primary,
    badgeText: MARCA.white,
    urgent: false,
    minimal: false,
    ...parcial,
  };
}

export const ART_TEMPLATES: Record<TemplateKey, ArtTheme> = {
  urgente: tema({
    label: "ALERTA",
    badge: MARCA.accent,
    badgeText: MARCA.text,
    urgent: true,
  }),
  seguranca: tema({ label: "SEGURANÇA" }),
  transito: tema({ label: "TRÂNSITO" }),
  clima: tema({ label: "CLIMA", badge: MARCA.secondary }),
  prefeitura: tema({ label: "SERVIÇO" }),
  cidade: tema({ label: "CIDADE" }),
  eventos: tema({ label: "EVENTOS", badge: MARCA.secondary }),
  turismo: tema({ label: "TURISMO", badge: MARCA.secondary }),
  esportes: tema({ label: "ESPORTES", badge: MARCA.secondary }),
  saude: tema({ label: "SAÚDE" }),
  educacao: tema({ label: "EDUCAÇÃO" }),
  economia: tema({ label: "ECONOMIA" }),
  comunidade: tema({ label: "COMUNIDADE", badge: MARCA.secondary }),
  foto_especial: tema({ label: "FOTO ESPECIAL", badge: MARCA.primary, minimal: true }),
  patrocinado: tema({ label: "PUBLICIDADE", badge: MARCA.accent, badgeText: MARCA.text }),
};

/** Área segura (px) das artes; nada de texto encosta na borda. */
export const SAFE_AREA = 60;

export const CORES_APOIO = {
  branco: MARCA.white,
  azul: MARCA.primary,
  azulClaro: MARCA.secondary,
  amarelo: MARCA.accent,
  texto: MARCA.text,
  fundo: MARCA.background,
} as const;

export function temaDoTemplate(key: TemplateKey): ArtTheme {
  return ART_TEMPLATES[key];
}
