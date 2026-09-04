/**
 * Renderização das artes em SVG — determinística, pura, sem IA.
 *
 * Gera a string SVG completa (1080×1350, 1080×1080 ou 1080×1920) com todos os
 * componentes reutilizáveis: logo, faixa de categoria, selo urgente, imagem,
 * título, subtítulo, fonte, data, patrocinador, rodapé e CTA.
 *
 * Nada de DOM, rede, banco ou secrets: só entrada → SVG.
 */

import { APP_NAME, CIDADE_COMPLETA, NOME_DO_PERFIL } from "@/config/app";
import type { TemplateKey } from "@/lib/templates/postTemplates";
import {
  DIMENSOES,
  SAFE_AREA,
  CORES_APOIO,
  temaDoTemplate,
  type ArtFormat,
} from "./artTemplates";
import { ajustarTexto } from "./textFit";

export interface EntradaArte {
  template: TemplateKey;
  format: ArtFormat;
  title: string;
  subtitle?: string | null;
  /** URL absoluta da imagem (opcional). Sem imagem, usa fundo sólido. */
  imageUrl?: string | null;
  sourceName?: string | null;
  /** Data já formatada para exibição (ex.: "04/09/2026"). */
  dateLabel?: string | null;
  sponsorName?: string | null;
  sponsorLogoUrl?: string | null;
  cta?: string | null;
}

/** Escapa texto para uso seguro dentro do SVG. */
export function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const FONTE = "'Helvetica Neue', Helvetica, Arial, sans-serif";

interface Layout {
  imagemAltura: number;
  painelY: number;
  painelAltura: number;
  tituloFonte: number;
}

function layoutDoFormato(format: ArtFormat): Layout {
  const { height } = DIMENSOES[format];
  if (format === "story") {
    return {
      imagemAltura: Math.round(height * 0.5),
      painelY: Math.round(height * 0.5),
      painelAltura: Math.round(height * 0.42),
      tituloFonte: 86,
    };
  }
  if (format === "square") {
    return {
      imagemAltura: Math.round(height * 0.48),
      painelY: Math.round(height * 0.48),
      painelAltura: Math.round(height * 0.44),
      tituloFonte: 72,
    };
  }
  return {
    imagemAltura: Math.round(height * 0.52),
    painelY: Math.round(height * 0.52),
    painelAltura: Math.round(height * 0.4),
    tituloFonte: 78,
  };
}

/** Gera o SVG completo da arte. */
export function renderizarArteSvg(entrada: EntradaArte): string {
  const { width, height } = DIMENSOES[entrada.format];
  const tema = temaDoTemplate(entrada.template);
  const layout = layoutDoFormato(entrada.format);
  const larguraUtil = width - SAFE_AREA * 2;

  const titulo = ajustarTexto(entrada.title, {
    larguraMax: larguraUtil,
    alturaMax: layout.painelAltura - 220,
    fontSizeInicial: layout.tituloFonte,
    fontSizeMinimo: 40,
    lineHeight: 1.12,
    peso: "bold",
  });

  const subtitulo = entrada.subtitle
    ? ajustarTexto(entrada.subtitle, {
        larguraMax: larguraUtil,
        alturaMax: 140,
        fontSizeInicial: 38,
        fontSizeMinimo: 26,
        lineHeight: 1.25,
        peso: "regular",
      })
    : null;

  const partes: string[] = [];

  // Fundo
  partes.push(`<rect width="${width}" height="${height}" fill="${tema.bg}"/>`);

  // Imagem (object-fit: cover via preserveAspectRatio) ou bloco sólido
  if (entrada.imageUrl) {
    partes.push(
      `<clipPath id="clipImg"><rect x="0" y="0" width="${width}" height="${layout.imagemAltura}"/></clipPath>`,
      `<image href="${escaparXml(entrada.imageUrl)}" x="0" y="0" width="${width}" height="${layout.imagemAltura}" preserveAspectRatio="xMidYMid slice" clip-path="url(#clipImg)"/>`,
      `<rect x="0" y="${layout.imagemAltura - 220}" width="${width}" height="220" fill="${tema.bg}" opacity="0.55"/>`,
    );
  } else {
    partes.push(
      `<rect x="0" y="0" width="${width}" height="${layout.imagemAltura}" fill="${tema.accent}" opacity="0.35"/>`,
    );
  }

  // Logo / marca
  partes.push(
    `<rect x="${SAFE_AREA}" y="${SAFE_AREA}" width="${Math.min(560, larguraUtil)}" height="88" rx="16" fill="${CORES_APOIO.branco}" opacity="0.94"/>`,
    `<text x="${SAFE_AREA + 24}" y="${SAFE_AREA + 58}" font-family="${FONTE}" font-size="36" font-weight="700" fill="${CORES_APOIO.azul}">${escaparXml(APP_NAME.replace("Projeto ", ""))}</text>`,
  );

  // Faixa de categoria + selo urgente
  const faixaY = layout.painelY - 76;
  const rotulo = escaparXml(tema.label);
  const larguraFaixa = Math.min(larguraUtil, rotulo.length * 24 + 64);
  partes.push(
    `<rect x="${SAFE_AREA}" y="${faixaY}" width="${larguraFaixa}" height="76" rx="8" fill="${tema.accent}"/>`,
    `<text x="${SAFE_AREA + 32}" y="${faixaY + 51}" font-family="${FONTE}" font-size="38" font-weight="800" letter-spacing="2" fill="${tema.accentText}">${rotulo}</text>`,
  );
  if (tema.urgent) {
    partes.push(
      `<rect x="${width - SAFE_AREA - 260}" y="${faixaY}" width="260" height="76" rx="8" fill="${CORES_APOIO.branco}"/>`,
      `<text x="${width - SAFE_AREA - 130}" y="${faixaY + 51}" text-anchor="middle" font-family="${FONTE}" font-size="38" font-weight="800" fill="#C62828">AGORA</text>`,
    );
  }

  // Painel de texto
  partes.push(
    `<rect x="0" y="${layout.painelY}" width="${width}" height="${height - layout.painelY}" fill="${tema.panel}"/>`,
  );

  // Título
  let cursorY = layout.painelY + SAFE_AREA + titulo.fontSize;
  for (const linha of titulo.linhas) {
    partes.push(
      `<text x="${SAFE_AREA}" y="${cursorY}" font-family="${FONTE}" font-size="${titulo.fontSize}" font-weight="800" fill="${tema.title}">${escaparXml(linha)}</text>`,
    );
    cursorY += titulo.fontSize * titulo.lineHeight;
  }

  // Subtítulo
  if (subtitulo) {
    cursorY += 24;
    for (const linha of subtitulo.linhas) {
      partes.push(
        `<text x="${SAFE_AREA}" y="${cursorY}" font-family="${FONTE}" font-size="${subtitulo.fontSize}" font-weight="400" fill="${tema.muted}">${escaparXml(linha)}</text>`,
      );
      cursorY += subtitulo.fontSize * subtitulo.lineHeight;
    }
  }

  // Patrocinador (bloco explícito de publicidade)
  if (entrada.sponsorName) {
    const y = height - SAFE_AREA - 200;
    partes.push(
      `<rect x="${SAFE_AREA}" y="${y}" width="${larguraUtil}" height="84" rx="12" fill="${tema.accent}" opacity="0.12"/>`,
      `<text x="${SAFE_AREA + 24}" y="${y + 54}" font-family="${FONTE}" font-size="34" font-weight="700" fill="${tema.title}">PUBLICIDADE • ${escaparXml(entrada.sponsorName)}</text>`,
    );
    if (entrada.sponsorLogoUrl) {
      partes.push(
        `<image href="${escaparXml(entrada.sponsorLogoUrl)}" x="${width - SAFE_AREA - 84}" y="${y + 10}" width="64" height="64" preserveAspectRatio="xMidYMid meet"/>`,
      );
    }
  }

  // Rodapé: fonte, data, CTA
  const rodapeY = height - SAFE_AREA - 70;
  const fonteTexto = entrada.sponsorName
    ? "Conteúdo publicitário"
    : entrada.sourceName
      ? `Fonte: ${entrada.sourceName}`
      : CIDADE_COMPLETA;
  partes.push(
    `<line x1="${SAFE_AREA}" y1="${rodapeY - 24}" x2="${width - SAFE_AREA}" y2="${rodapeY - 24}" stroke="${CORES_APOIO.cinza}" stroke-width="2"/>`,
    `<text x="${SAFE_AREA}" y="${rodapeY + 18}" font-family="${FONTE}" font-size="30" font-weight="600" fill="${tema.muted}">${escaparXml(fonteTexto)}</text>`,
  );
  if (entrada.dateLabel) {
    partes.push(
      `<text x="${width - SAFE_AREA}" y="${rodapeY + 18}" text-anchor="end" font-family="${FONTE}" font-size="30" font-weight="600" fill="${tema.muted}">${escaparXml(entrada.dateLabel)}</text>`,
    );
  }
  partes.push(
    `<text x="${SAFE_AREA}" y="${rodapeY + 58}" font-family="${FONTE}" font-size="28" font-weight="700" fill="${tema.title}">${escaparXml(entrada.cta ?? NOME_DO_PERFIL)}</text>`,
  );

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    ...partes,
    `</svg>`,
  ].join("");
}

/** Data URL do SVG — usada no preview e na exportação. */
export function svgParaDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
