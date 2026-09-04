/**
 * Templates de arte — definição declarativa, sem IA e sem serviço externo.
 *
 * Cores em HEX porque a arte é exportada como imagem (SVG/Canvas) e não
 * participa do tema da interface. Puro: sem DOM, sem rede.
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

export interface ArtTheme {
  /** Rótulo da faixa de categoria. */
  label: string;
  /** Cor de fundo principal. */
  bg: string;
  /** Cor do bloco de texto. */
  panel: string;
  /** Cor de destaque (faixa da categoria). */
  accent: string;
  /** Cor do texto sobre o destaque. */
  accentText: string;
  /** Cor do título. */
  title: string;
  /** Cor dos textos auxiliares. */
  muted: string;
  /** Selo de urgência visível. */
  urgent: boolean;
}

const AZUL = "#0B2545";
const AZUL_CLARO = "#123A6B";
const BRANCO = "#FFFFFF";
const CINZA = "#D6DEE9";

function tema(parcial: Partial<ArtTheme> & { label: string; accent: string }): ArtTheme {
  return {
    bg: AZUL,
    panel: BRANCO,
    accentText: BRANCO,
    title: AZUL,
    muted: "#5A6B82",
    urgent: false,
    ...parcial,
  } as ArtTheme;
}

export const ART_TEMPLATES: Record<TemplateKey, ArtTheme> = {
  urgente: tema({ label: "URGENTE", accent: "#C62828", bg: "#7F1D1D", urgent: true }),
  seguranca: tema({ label: "SEGURANÇA", accent: "#1F3A93" }),
  transito: tema({ label: "TRÂNSITO", accent: "#E07B00", accentText: "#1B1B1B" }),
  clima: tema({ label: "CLIMA", accent: "#0277BD" }),
  prefeitura: tema({ label: "PREFEITURA", accent: AZUL_CLARO }),
  cidade: tema({ label: "CIDADE", accent: "#15616D" }),
  eventos: tema({ label: "EVENTOS", accent: "#7B1FA2" }),
  turismo: tema({ label: "TURISMO", accent: "#00897B" }),
  esportes: tema({ label: "ESPORTES", accent: "#2E7D32" }),
  saude: tema({ label: "SAÚDE", accent: "#00838F" }),
  educacao: tema({ label: "EDUCAÇÃO", accent: "#3949AB" }),
  economia: tema({ label: "ECONOMIA", accent: "#4E342E" }),
  patrocinado: tema({
    label: "PUBLICIDADE",
    accent: "#37474F",
    bg: "#263238",
    muted: "#546E7A",
  }),
};

/** Área segura (px) das artes; nada de texto encosta na borda. */
export const SAFE_AREA = 64;

export const CORES_APOIO = { cinza: CINZA, branco: BRANCO, azul: AZUL } as const;

export function temaDoTemplate(key: TemplateKey): ArtTheme {
  return ART_TEMPLATES[key];
}
