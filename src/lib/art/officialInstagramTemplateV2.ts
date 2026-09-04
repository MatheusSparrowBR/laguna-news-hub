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

export const OFFICIAL_LOGO_PATH = "/branding/hora-news-laguna-logo.png";
const FONT = "Inter, Arial, Helvetica, sans-serif";
function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}
function wavePath(width: number, height: number, y: number, amplitude: number): string {
  const points = [`M 0 ${y}`];
  for (let i = 0; i <= 8; i += 1) {
    const x = (width / 8) * i;
    const yy = y + Math.sin((i / 8) * Math.PI * 2) * amplitude;
    points.push(`L ${x.toFixed(1)} ${yy.toFixed(1)}`);
  }
  points.push(`L ${width} ${height} L 0 ${height} Z`);
  return points.join(" ");
}

/** Arte oficial HORA NEWS LAGUNA para o Feed 1080×1350. Branding e geometria são fixos. */
export function renderOfficialInstagramSvg(input: OfficialInstagramArtInput, format: ArtFormat = "feed"): string {
  const { width, height } = DIMENSOES[format];
  const scale = height / 1350;
  const safe = SAFE_AREA * scale;
  const photoBottom = height * (format === "feed" ? 0.64 : 0.58);
  const titleWidth = width - safe * 2 - 24 * scale;
  const theme = temaDoTemplate(input.template);
  const title = ajustarTexto(input.title || "Título da publicação", { larguraMax: titleWidth, alturaMax: 185 * scale, fontSizeInicial: 62 * scale, fontSizeMinimo: 36 * scale, lineHeight: 1.03, peso: "bold" });
  const summary = input.summary ? ajustarTexto(input.summary, { larguraMax: titleWidth, alturaMax: 145 * scale, fontSizeInicial: 25 * scale, fontSizeMinimo: 19 * scale, lineHeight: 1.18, peso: "regular" }) : null;
  const metaDate = esc(input.dateLabel || new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase());
  const location = esc(input.location || "Laguna - SC");
  const credit = esc(input.photoCredit || "Divulgação");
  const label = esc(theme.label || "CIDADE");
  const clipId = `hora-photo-${format}`;
  const overlayId = `hora-overlay-${format}`;
  const parts: string[] = [];

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  parts.push(`<defs><clipPath id="${clipId}"><rect x="0" y="0" width="${width}" height="${photoBottom + 70 * scale}"/></clipPath><linearGradient id="${overlayId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${MARCA.primary}" stop-opacity="0"/><stop offset=".72" stop-color="${MARCA.primary}" stop-opacity=".05"/><stop offset="1" stop-color="${MARCA.primary}" stop-opacity=".86"/></linearGradient></defs>`);
  parts.push(`<rect width="${width}" height="${height}" fill="${MARCA.primary}"/>`);
  if (input.imageUrl) {
    parts.push(`<image href="${esc(input.imageUrl)}" x="0" y="0" width="${width}" height="${photoBottom + 80 * scale}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`);
    parts.push(`<rect x="0" y="0" width="${width}" height="${photoBottom + 80 * scale}" fill="url(#${overlayId})"/>`);
  }

  const pillX = safe * 0.65;
  const pillY = 32 * scale;
  const pillH = 54 * scale;
  const pillW = Math.min(360 * scale, width * 0.38);
  const pillFill = theme.badge === MARCA.accent ? MARCA.accent : MARCA.primary;
  const pillText = theme.badge === MARCA.accent ? MARCA.text : MARCA.white;
  parts.push(`<rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="12" fill="${pillFill}"/>`);
  parts.push(`<circle cx="${pillX + 29 * scale}" cy="${pillY + pillH / 2}" r="16" fill="${MARCA.accent}"/>`);
  parts.push(`<text x="${pillX + 55 * scale}" y="${pillY + 36 * scale}" font-family="${FONT}" font-size="${25 * scale}" font-weight="900" fill="${pillText}">${label}</text>`);
  const dateW = 270 * scale;
  const dateX = width - safe * 0.65 - dateW;
  parts.push(`<rect x="${dateX}" y="${pillY}" width="${dateW}" height="${pillH}" rx="12" fill="${MARCA.accent}"/>`);
  parts.push(`<text x="${dateX + 22 * scale}" y="${pillY + 36 * scale}" font-family="${FONT}" font-size="${22 * scale}" font-weight="900" fill="${MARCA.text}">${metaDate}</text>`);

  parts.push(`<path d="M0 ${photoBottom} C ${width * 0.24} ${photoBottom - 22 * scale}, ${width * 0.48} ${photoBottom + 18 * scale}, ${width * 0.72} ${photoBottom - 10 * scale} C ${width * 0.86} ${photoBottom - 26 * scale}, ${width * 0.94} ${photoBottom - 4 * scale}, ${width} ${photoBottom - 12 * scale} L${width} ${height} L0 ${height}Z" fill="${MARCA.primary}"/>`);

  const titleLineHeight = title.fontSize * title.lineHeight;
  const titleHeight = title.linhas.length * titleLineHeight;
  let titleY = photoBottom + 84 * scale;
  titleY = Math.min(titleY, height - 330 * scale - titleHeight);
  titleY = Math.max(photoBottom + 68 * scale, titleY);
  parts.push(`<rect x="${safe}" y="${titleY - 28 * scale}" width="${7 * scale}" height="${Math.max(95 * scale, Math.min(140 * scale, titleHeight + 25 * scale))}" rx="3" fill="${MARCA.accent}"/>`);
  for (let i = 0; i < title.linhas.length; i += 1) {
    const lastLine = i === title.linhas.length - 1 && title.linhas.length > 1;
    parts.push(`<text x="${safe + 24 * scale}" y="${titleY + i * titleLineHeight}" font-family="${FONT}" font-size="${title.fontSize}" font-weight="900" fill="${lastLine ? MARCA.accent : MARCA.white}">${esc(title.linhas[i])}</text>`);
  }

  let cursorY = titleY + titleHeight + 20 * scale;
  if (summary) {
    for (const line of summary.linhas) {
      parts.push(`<text x="${safe + 24 * scale}" y="${cursorY}" font-family="${FONT}" font-size="${summary.fontSize}" font-weight="500" fill="${MARCA.white}" opacity=".97">${esc(line)}</text>`);
      cursorY += summary.fontSize * summary.lineHeight;
    }
  }

  const footerY = height - 164 * scale;
  parts.push(`<line x1="${safe}" y1="${footerY - 28 * scale}" x2="${width - safe}" y2="${footerY - 28 * scale}" stroke="${MARCA.secondary}" stroke-opacity=".55"/>`);
  parts.push(`<text x="${safe}" y="${footerY + 8 * scale}" font-family="${FONT}" font-size="${20 * scale}" font-weight="700" fill="${MARCA.white}">●  ${location}</text>`);
  parts.push(`<text x="${safe + 300 * scale}" y="${footerY + 8 * scale}" font-family="${FONT}" font-size="${19 * scale}" font-weight="600" fill="${MARCA.white}">│  Foto: ${credit}</text>`);

  const logoSize = 190 * scale;
  const logoX = width - safe - logoSize;
  const logoY = height - safe - logoSize + 8 * scale;
  parts.push(`<image href="${OFFICIAL_LOGO_PATH}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>`);
  parts.push(`<path d="${wavePath(width, height, height - 64 * scale, 18 * scale)}" fill="${MARCA.secondary}" opacity=".92"/>`);
  parts.push(`<path d="M0 ${height - 31 * scale} Q ${width * .38} ${height - 7 * scale}, ${width * .7} ${height - 40 * scale} T ${width} ${height - 22 * scale}" fill="none" stroke="${MARCA.accent}" stroke-width="${7 * scale}"/>`);
  if (input.sponsorName) {
    parts.push(`<text x="${safe}" y="${height - 88 * scale}" font-family="${FONT}" font-size="${18 * scale}" font-weight="800" fill="${MARCA.text}">PUBLICIDADE • ${esc(input.sponsorName)}</text>`);
  }
  parts.push(`</svg>`);
  return parts.join("");
}

export const OFFICIAL_INSTAGRAM_TEMPLATE = {
  key: "hora-news-laguna-official",
  format: "feed" as const,
  width: 1080,
  height: 1350,
  logoPath: OFFICIAL_LOGO_PATH,
} as const;
