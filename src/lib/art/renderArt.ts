/**
 * Renderização determinística das artes HORA NEWS LAGUNA — sem IA.
 *
 * Feed: 1080×1350 (formato principal). A fotografia ocupa toda a composição;
 * um overlay discreto azul é aplicado apenas onde melhora a leitura.
 */

import { CIDADE_COMPLETA, NOME_DO_PERFIL } from "@/config/app";
import type { TemplateKey } from "@/lib/templates/postTemplates";
import { DIMENSOES, MARCA, SAFE_AREA, temaDoTemplate, type ArtFormat } from "./artTemplates";
import { ajustarTexto } from "./textFit";

export interface EntradaArte {
  template: TemplateKey;
  format: ArtFormat;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  sourceName?: string | null;
  dateLabel?: string | null;
  sponsorName?: string | null;
  sponsorLogoUrl?: string | null;
  cta?: string | null;
}

export function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const FONTE = "Inter, Arial, sans-serif";

interface Layout {
  titleFont: number;
  titleMaxHeight: number;
  contentBottom: number;
}

function layoutDoFormato(format: ArtFormat): Layout {
  const height = DIMENSOES[format].height;
  if (format === "story") {
    return { titleFont: 86, titleMaxHeight: 420, contentBottom: height - 250 };
  }
  if (format === "square") {
    return { titleFont: 72, titleMaxHeight: 330, contentBottom: height - 190 };
  }
  return { titleFont: 78, titleMaxHeight: 390, contentBottom: height - 205 };
}

function logoSvg(x: number, y: number, scale = 1): string {
  const w = 330 * scale;
  return [
    `<g transform="translate(${x} ${y}) scale(${scale})">`,
    `<circle cx="32" cy="34" r="28" fill="${MARCA.accent}"/>`,
    `<path d="M20 54V28l12-10 12 10v26H20Z" fill="${MARCA.primary}"/>`,
    `<path d="M25 27h14v27H25z" fill="${MARCA.white}" opacity=".95"/>`,
    `<path d="M16 16h32" stroke="${MARCA.secondary}" stroke-width="5" stroke-linecap="round"/>`,
    `<text x="70" y="30" font-family="${FONTE}" font-size="30" font-weight="800" fill="${MARCA.white}" letter-spacing="1">HORA NEWS</text>`,
    `<text x="70" y="58" font-family="${FONTE}" font-size="24" font-weight="700" fill="${MARCA.accent}">LAGUNA</text>`,
    `<text x="70" y="84" font-family="${FONTE}" font-size="14" font-weight="600" fill="${MARCA.white}">INFORMAÇÃO QUE CONECTA NOSSA CIDADE</text>`,
    `</g>`,
    `<!-- logo width ${w} -->`,
  ].join("");
}

/** Gera o SVG completo da arte. */
export function renderizarArteSvg(entrada: EntradaArte): string {
  const { width, height } = DIMENSOES[entrada.format];
  const tema = temaDoTemplate(entrada.template);
  const layout = layoutDoFormato(entrada.format);
  const larguraUtil = width - SAFE_AREA * 2;

  const titulo = ajustarTexto(entrada.title, {
    larguraMax: larguraUtil,
    alturaMax: layout.titleMaxHeight,
    fontSizeInicial: layout.titleFont,
    fontSizeMinimo: 40,
    lineHeight: 1.08,
    peso: "bold",
  });

  const subtitulo = entrada.subtitle
    ? ajustarTexto(entrada.subtitle, {
        larguraMax: larguraUtil,
        alturaMax: 120,
        fontSizeInicial: 34,
        fontSizeMinimo: 24,
        lineHeight: 1.2,
        peso: "regular",
      })
    : null;

  const partes: string[] = [];
  const gradientId = `hora-overlay-${entrada.template}-${entrada.format}`.replace(/[^a-z0-9-]/gi, "-");

  // Fundo oficial.
  partes.push(`<rect width="${width}" height="${height}" fill="${MARCA.background}"/>`);

  // A foto é dominante (80–90%+). Não existe faixa azul sólida inferior.
  if (entrada.imageUrl) {
    partes.push(
      `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${MARCA.primary}" stop-opacity="0"/><stop offset="58%" stop-color="${MARCA.primary}" stop-opacity="0.04"/><stop offset="100%" stop-color="${MARCA.primary}" stop-opacity="0.86"/></linearGradient></defs>`,
      `<image href="${escaparXml(entrada.imageUrl)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`,
      `<rect x="0" y="0" width="${width}" height="${height}" fill="url(#${gradientId})"/>`,
    );
  } else {
    partes.push(`<rect x="0" y="0" width="${width}" height="${height}" fill="${MARCA.primary}" opacity="0.08"/>`);
  }

  // Categoria no topo esquerdo.
  const faixaY = SAFE_AREA;
  const labelWidth = Math.min(larguraUtil * 0.62, Math.max(190, tema.label.length * 24 + 72));
  partes.push(
    `<rect x="${SAFE_AREA}" y="${faixaY}" width="${labelWidth}" height="64" rx="10" fill="${tema.badge}"/>`,
    `<text x="${SAFE_AREA + 24}" y="${faixaY + 43}" font-family="${FONTE}" font-size="30" font-weight="800" letter-spacing="1.4" fill="${tema.badgeText}">${escaparXml(tema.label)}</text>`,
  );

  // Data/local no topo direito, sem competir com o título.
  const meta = [CIDADE_COMPLETA, entrada.dateLabel].filter(Boolean).join(" • ");
  if (meta) {
    partes.push(
      `<text x="${width - SAFE_AREA}" y="${faixaY + 40}" text-anchor="end" font-family="${FONTE}" font-size="22" font-weight="700" fill="${MARCA.white}">${escaparXml(meta)}</text>`,
    );
  }

  // Título e subtítulo sobre a região inferior da fotografia.
  const titleBlockHeight = titulo.linhas.length * titulo.fontSize * titulo.lineHeight;
  let cursorY = layout.contentBottom - titleBlockHeight;
  cursorY = Math.max(SAFE_AREA + 160, cursorY);

  for (const linha of titulo.linhas) {
    partes.push(
      `<text x="${SAFE_AREA}" y="${cursorY}" font-family="${FONTE}" font-size="${titulo.fontSize}" font-weight="800" fill="${MARCA.white}" stroke="${MARCA.primary}" stroke-opacity="0.2" stroke-width="1">${escaparXml(linha)}</text>`,
    );
    cursorY += titulo.fontSize * titulo.lineHeight;
  }

  if (subtitulo) {
    cursorY += 18;
    for (const linha of subtitulo.linhas) {
      partes.push(
        `<text x="${SAFE_AREA}" y="${cursorY}" font-family="${FONTE}" font-size="${subtitulo.fontSize}" font-weight="500" fill="${MARCA.white}" opacity="0.96">${escaparXml(linha)}</text>`,
      );
      cursorY += subtitulo.fontSize * subtitulo.lineHeight;
    }
  }

  // Assinatura visual integrada, sem banner azul sólido.
  const logoY = height - SAFE_AREA - 118;
  partes.push(
    `<g opacity="0.98">${logoSvg(SAFE_AREA, logoY, 1)}</g>`,
  );

  // Publicidade permanece explicitamente identificada.
  if (entrada.sponsorName) {
    const y = logoY - 58;
    partes.push(
      `<rect x="${width - SAFE_AREA - 390}" y="${y}" width="390" height="48" rx="10" fill="${MARCA.white}" opacity="0.92"/>`,
      `<text x="${width - SAFE_AREA - 366}" y="${y + 32}" font-family="${FONTE}" font-size="18" font-weight="800" fill="${MARCA.text}">PUBLICIDADE • ${escaparXml(entrada.sponsorName)}</text>`,
    );
    if (entrada.sponsorLogoUrl) {
      partes.push(`<image href="${escaparXml(entrada.sponsorLogoUrl)}" x="${width - SAFE_AREA - 58}" y="${y + 5}" width="38" height="38" preserveAspectRatio="xMidYMid meet"/>`);
    }
  }

  // Fonte/CTA em safe area inferior, mantendo a marca como elemento principal.
  const fonteTexto = entrada.sponsorName
    ? "Conteúdo publicitário"
    : entrada.sourceName
      ? `Fonte: ${entrada.sourceName}`
      : CIDADE_COMPLETA;
  partes.push(
    `<text x="${width - SAFE_AREA}" y="${height - SAFE_AREA}" text-anchor="end" font-family="${FONTE}" font-size="18" font-weight="600" fill="${MARCA.white}" opacity="0.92">${escaparXml(entrada.cta ?? fonteTexto)}</text>`,
  );

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    ...partes,
    `</svg>`,
  ].join("");
}

export function svgParaDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
