import type { TemplateKey } from "@/lib/templates/postTemplates";
import { MARCA, DIMENSOES, SAFE_AREA, temaDoTemplate, type ArtFormat } from "./artTemplates";
import { ajustarTexto } from "./textFit";

export interface OfficialInstagramArtInput {
  template: TemplateKey;
  title: string;
  summary?: string | null;
  imageUrl?: string | null;
  dateLabel?: string | null;
  location?: string | null;
  photoCredit?: string | null;
  sponsorName?: string | null;
}

const LOGO = "/branding/hora-news-laguna-logo.svg";
const FONT = "Inter, Arial, Helvetica, sans-serif";

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}

function wavePath(width: number, y: number, amplitude: number, phase: number): string {
  const points: string[] = [`M 0 ${y}`];
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const x = (width / steps) * i;
    const yy = y + Math.sin((i / steps) * Math.PI * 2 + phase) * amplitude;
    points.push(`L ${x.toFixed(1)} ${yy.toFixed(1)}`);
  }
  points.push(`L ${width} 1350 L 0 1350 Z`);
  return points.join(" ");
}

export function renderOfficialInstagramSvg(input: OfficialInstagramArtInput, format: ArtFormat = "feed"): string {
  const { width, height } = DIMENSOES[format];
  const scale = height / 1350;
  const safe = SAFE_AREA * scale;
  const isFeed = format === "feed";
  const panelTop = height * (isFeed ? 0.565 : 0.52);
  const titleWidth = width - safe * 2;
  const theme = temaDoTemplate(input.template);
  const title = ajustarTexto(input.title || "Título da publicação", {
    larguraMax: titleWidth,
    alturaMax: 185 * scale,
    fontSizeInicial: 62 * scale,
    fontSizeMinimo: 36 * scale,
    lineHeight: 1.03,
    peso: "bold",
  });
  const summary = input.summary ? ajustarTexto(input.summary, {
    larguraMax: titleWidth - 12 * scale,
    alturaMax: 145 * scale,
    fontSizeInicial: 25 * scale,
    fontSizeMinimo: 19 * scale,
    lineHeight: 1.18,
    peso: "regular",
  }) : null;

  const clipId = `official-photo-${format}`;
  const overlayId = `official-overlay-${format}`;
  const metaDate = esc(input.dateLabel || new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase());
  const location = esc(input.location || "Laguna - SC");
  const credit = esc(input.photoCredit || "Divulgação");
  const label = esc(theme.label || "CIDADE");
  const titleLines = title.linhas;
  const titleLineHeight = title.fontSize * title.lineHeight;
  let titleY = panelTop + 105 * scale;
  const titleColor = MARCA.white;
  const titleAccent = MARCA.accent;

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  parts.push(`<defs>`);
  parts.push(`<clipPath id="${clipId}"><rect x="0" y="0" width="${width}" height="${panelTop + 50 * scale}"/></clipPath>`);
  parts.push(`<linearGradient id="${overlayId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${MARCA.primary}" stop-opacity="0"/><stop offset="72%" stop-color="${MARCA.primary}" stop-opacity="0.05"/><stop offset="100%" stop-color="${MARCA.primary}" stop-opacity="0.84"/></linearGradient>`);
  parts.push(`</defs>`);
  parts.push(`<rect width="${width}" height="${height}" fill="${MARCA.primary}"/>`);

  if (input.imageUrl) {
    parts.push(`<image href="${esc(input.imageUrl)}" x="0" y="0" width="${width}" height="${panelTop + 65 * scale}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`);
    parts.push(`<rect x="0" y="0" width="${width}" height="${panelTop + 65 * scale}" fill="url(#${overlayId})"/>`);
  } else {
    parts.push(`<rect x="0" y="0" width="${width}" height="${panelTop + 65 * scale}" fill="${MARCA.secondary}" opacity="0.45"/>`);
  }

  // Header: fixed geometry, dynamic category/date.
  const pillY = 32 * scale;
  const pillH = 54 * scale;
  const pillW = Math.min(360 * scale, width * 0.38);
  parts.push(`<rect x="${safe * 0.65}" y="${pillY}" width="${pillW}" height="${pillH}" rx="12" fill="${theme.badge === MARCA.accent ? MARCA.accent : MARCA.primary}"/>`);
  parts.push(`<circle cx="${safe * 0.65 + 29 * scale}" cy="${pillY + pillH / 2}" r="16 * scale" fill="${MARCA.accent}"/>`);
  parts.push(`<text x="${safe * 0.65 + 55 * scale}" y="${pillY + 36 * scale}" font-family="${FONT}" font-size="25 * scale" font-weight="900" fill="${theme.badge === MARCA.accent ? MARCA.text : MARCA.white}">${label}</text>`);
  const dateW = 270 * scale;
  parts.push(`<rect x="${width - safe * 0.65 - dateW}" y="${pillY}" width="${dateW}" height="${pillH}" rx="12" fill="${MARCA.accent}"/>`);
  parts.push(`<text x="${width - safe * 0.65 - dateW + 22 * scale}" y="${pillY + 36 * scale}" font-family="${FONT}" font-size="22 * scale" font-weight="900" fill="${MARCA.text}">${metaDate}</text>`);

  // Editorial panel.
  parts.push(`<path d="M0 ${panelTop} L${width} ${panelTop} L${width} ${height} L0 ${height}Z" fill="${MARCA.primary}"/>`);
  parts.push(`<path d="M0 ${panelTop} C ${width * 0.24} ${panelTop - 22 * scale}, ${width * 0.48} ${panelTop + 18 * scale}, ${width * 0.72} ${panelTop - 10 * scale} C ${width * 0.86} ${panelTop - 26 * scale}, ${width * 0.94} ${panelTop - 4 * scale}, ${width} ${panelTop - 12 * scale} L${width} ${panelTop + 34 * scale} L0 ${panelTop + 34 * scale}Z" fill="${MARCA.primary}" opacity="0.96"/>`);

  const accentStart = Math.max(panelTop + 74 * scale, titleY - 26 * scale);
  parts.push(`<rect x="${safe}" y="${accentStart}" width="7 * scale" height="${Math.min(140 * scale, height - accentStart - 160 * scale)}" rx="3" fill="${MARCA.accent}"/>`);

  for (let i = 0; i < titleLines.length; i++) {
    const line = titleLines[i];
    const useAccent = i === titleLines.length - 1 && titleLines.length > 1;
    parts.push(`<text x="${safe + 24 * scale}" y="${titleY + i * titleLineHeight}" font-family="${FONT}" font-size="${title.fontSize}" font-weight="900" fill="${useAccent ? titleAccent : titleColor}">${esc(line)}</text>`);
  }

  let cursorY = titleY + titleLines.length * titleLineHeight + 20 * scale;
  if (summary) {
    for (const line of summary.linhas) {
      parts.push(`<text x="${safe + 24 * scale}" y="${cursorY}" font-family="${FONT}" font-size="${summary.fontSize}" font-weight="500" fill="${MARCA.white}" opacity="0.97">${esc(line)}</text>`);
      cursorY += summary.fontSize * summary.lineHeight;
    }
  }

  // Footer information and fixed official logo.
  const footerY = height - 122 * scale;
  parts.push(`<line x1="${safe}" y1="${footerY - 24 * scale}" x2="${width - safe}" y2="${footerY - 24 * scale}" stroke="${MARCA.secondary}" stroke-opacity="0.55"/>`);
  parts.push(`<text x="${safe}" y="${footerY + 18 * scale}" font-family="${FONT}" font-size="20 * scale" font-weight="700" fill="${MARCA.white}">●  ${location}</text>`);
  parts.push(`<text x="${safe + 300 * scale}" y="${footerY + 18 * scale}" font-family="${FONT}" font-size="19 * scale" font-weight="600" fill="${MARCA.white}">│  Foto: ${credit}</text>`);

  const logoSize = 190 * scale;
  const logoX = width - safe - logoSize;
  const logoY = height - safe - logoSize + 5 * scale;
  parts.push(`<image href="${LOGO}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>`);

  // Signature waves: fixed part of the official layout.
  parts.push(`<path d="${wavePath(width, height - 64 * scale, 18 * scale, 0)}" fill="${MARCA.secondary}" opacity="0.9"/>`);
  parts.push(`<path d="M0 ${height - 31 * scale} Q ${width * 0.38} ${height - 7 * scale}, ${width * 0.7} ${height - 40 * scale} T ${width} ${height - 22 * scale}" fill="none" stroke="${MARCA.accent}" stroke-width="7 * scale"/>`);
  parts.push(`</svg>`);
  return parts.join("");
}

export const OFFICIAL_INSTAGRAM_TEMPLATE = {
  key: "hora-news-laguna-official",
  format: "feed" as const,
  width: 1080,
  height: 1350,
  logoPath: LOGO,
};
