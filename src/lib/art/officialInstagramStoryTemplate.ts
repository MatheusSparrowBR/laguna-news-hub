import type { TemplateKey } from "@/lib/templates/postTemplates";
import { DIMENSOES, MARCA, SAFE_AREA, temaDoTemplate } from "./artTemplates";
import { ajustarTexto } from "./textFit";

export interface OfficialInstagramStoryArtInput { template: TemplateKey; title: string; summary?: string | null | undefined; imageUrl?: string | null | undefined; dateLabel?: string | null | undefined; location?: string | null | undefined; photoCredit?: string | null | undefined; sponsorName?: string | null | undefined; }
export const OFFICIAL_INSTAGRAM_STORY_TEMPLATE = { key: "hora-news-laguna-official-story", format: "story" as const, width: DIMENSOES.story.width, height: DIMENSOES.story.height, logoPath: "/branding/hora-news-laguna-logo.png", logoX: 770, logoY: 1670, logoWidth: 250, logoHeight: 250 } as const;
const FONT = "Inter, Arial, Helvetica, sans-serif";
const W = DIMENSOES.story.width, H = DIMENSOES.story.height;
function esc(value: string): string { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
function formatDate(value?: string | null): string { return value || new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }); }

/** Composição editorial própria para Instagram Stories 1080×1920; não é o Feed esticado. */
export function renderOfficialInstagramStorySvg(input: OfficialInstagramStoryArtInput): string {
  const safe = SAFE_AREA, theme = temaDoTemplate(input.template);
  const title = ajustarTexto(input.title || "Título da publicação", { larguraMax: W - safe * 2 - 32, alturaMax: 300, fontSizeInicial: 66, fontSizeMinimo: 42, lineHeight: 1.02, peso: "bold" });
  const summary = input.summary ? ajustarTexto(input.summary, { larguraMax: W - safe * 2 - 32, alturaMax: 190, fontSizeInicial: 28, fontSizeMinimo: 21, lineHeight: 1.16, peso: "regular" }) : null;
  const date = esc(formatDate(input.dateLabel)), location = esc(input.location || "Laguna - SC"), credit = esc(input.photoCredit || "Divulgação"), label = esc(theme.label || "CIDADE");
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  parts.push(`<defs><clipPath id="story-photo"><rect width="${W}" height="1110"/></clipPath><linearGradient id="story-overlay" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${MARCA.primary}" stop-opacity=".05"/><stop offset="72%" stop-color="${MARCA.primary}" stop-opacity=".15"/><stop offset="100%" stop-color="${MARCA.primary}" stop-opacity=".94"/></linearGradient></defs>`);
  parts.push(`<rect width="${W}" height="${H}" fill="${MARCA.primary}"/>`);
  if (input.imageUrl) { parts.push(`<image href="${esc(input.imageUrl)}" x="0" y="0" width="${W}" height="1110" preserveAspectRatio="xMidYMid slice" clip-path="url(#story-photo)"/>`); parts.push(`<rect width="${W}" height="1110" fill="url(#story-overlay)"/>`); } else parts.push(`<rect width="${W}" height="1110" fill="${MARCA.secondary}" opacity=".55"/>`);
  parts.push(`<rect x="${safe}" y="54" width="350" height="64" rx="14" fill="${theme.badge === MARCA.accent ? MARCA.accent : MARCA.primary}"/><circle cx="${safe + 34}" cy="86" r="17" fill="${MARCA.accent}"/><text x="${safe + 64}" y="95" font-family="${FONT}" font-size="27" font-weight="900" fill="${theme.badge === MARCA.accent ? MARCA.text : MARCA.white}">${label}</text>`);
  parts.push(`<rect x="748" y="54" width="272" height="64" rx="14" fill="${MARCA.accent}"/><text x="770" y="95" font-family="${FONT}" font-size="22" font-weight="900" fill="${MARCA.text}">${date}</text>`);
  parts.push(`<path d="M0 1060 C210 1025 390 1090 590 1055 C790 1020 930 1065 1080 1035 L1080 1920 L0 1920Z" fill="${MARCA.primary}"/>`);
  const titleY = 1230;
  const accentHeight = Math.max(130, Math.min(300, title.linhas.length * title.fontSize * title.lineHeight + 30));
  parts.push(`<rect x="${safe}" y="${titleY - 55}" width="8" height="${accentHeight}" rx="4" fill="${MARCA.accent}"/>`);
  title.linhas.forEach((line, index) => { const lastLine = index === title.linhas.length - 1 && title.linhas.length > 1; parts.push(`<text x="${safe + 26}" y="${titleY + index * title.fontSize * title.lineHeight}" font-family="${FONT}" font-size="${title.fontSize}" font-weight="900" fill="${lastLine ? MARCA.accent : MARCA.white}">${esc(line)}</text>`); });
  let cursorY = titleY + title.linhas.length * title.fontSize * title.lineHeight + 26;
  if (summary) for (const line of summary.linhas) { parts.push(`<text x="${safe + 26}" y="${cursorY}" font-family="${FONT}" font-size="${summary.fontSize}" font-weight="500" fill="${MARCA.white}" opacity=".96">${esc(line)}</text>`); cursorY += summary.fontSize * summary.lineHeight; }
  const footerY = 1705;
  parts.push(`<line x1="${safe}" y1="${footerY - 28}" x2="${W - safe}" y2="${footerY - 28}" stroke="${MARCA.secondary}" stroke-width="2" stroke-opacity=".7"/>`);
  parts.push(`<text x="${safe}" y="${footerY + 10}" font-family="${FONT}" font-size="20" font-weight="700" fill="${MARCA.white}">●  ${location}</text><text x="${safe}" y="${footerY + 52}" font-family="${FONT}" font-size="18" font-weight="600" fill="${MARCA.white}">Foto: ${credit}</text>`);
  // A logo PNG oficial é adicionada pelo preview/exportador como uma imagem real, não como href dentro do SVG.
  parts.push(`<path d="M0 1840 C250 1805 430 1870 690 1830 C850 1805 950 1830 1080 1800 L1080 1920 L0 1920Z" fill="${MARCA.secondary}" opacity=".95"/><path d="M0 1870 C260 1835 470 1895 710 1860 C880 1835 970 1860 1080 1830" fill="none" stroke="${MARCA.accent}" stroke-width="8"/>`);
  if (input.sponsorName) parts.push(`<text x="${safe}" y="1815" font-family="${FONT}" font-size="18" font-weight="800" fill="${MARCA.text}">PUBLICIDADE • ${esc(input.sponsorName)}</text>`);
  parts.push(`</svg>`);
  return parts.join("");
}
