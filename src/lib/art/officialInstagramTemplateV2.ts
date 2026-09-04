import type { TemplateKey } from "@/lib/templates/postTemplates";
import { MARCA, SAFE_AREA, temaDoTemplate } from "./artTemplates";
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

/**
 * Arte oficial do Feed HORA NEWS LAGUNA.
 * A identidade de marca fica concentrada no rodapé, no mesmo local da
 * referência visual: logo oficial à esquerda + assinatura/slogan à direita.
 */
export const OFFICIAL_INSTAGRAM_TEMPLATE = {
  key: "hora-news-laguna-official",
  format: "feed" as const,
  width: 1080,
  height: 1350,
  logoPath: "/branding/hora-news-laguna-logo.png",
  logoX: 52,
  logoY: 1190,
  logoWidth: 108,
  logoHeight: 108,
  brandingBarX: 36,
  brandingBarY: 1180,
  brandingBarWidth: 1008,
  brandingBarHeight: 118,
} as const;

const FONT = "Inter, Arial, Helvetica, sans-serif";
function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
}

export function renderOfficialInstagramSvg(input: OfficialInstagramArtInput): string {
  const W = 1080;
  const H = 1350;
  const safe = SAFE_AREA;
  const panelTop = 765;
  const theme = temaDoTemplate(input.template);

  const title = ajustarTexto(input.title || "Título da publicação", {
    larguraMax: W - safe * 2 - 24,
    alturaMax: 175,
    fontSizeInicial: 62,
    fontSizeMinimo: 38,
    lineHeight: 1.03,
    peso: "bold",
  });

  const summary = input.summary
    ? ajustarTexto(input.summary, {
        larguraMax: W - safe * 2 - 24,
        alturaMax: 132,
        fontSizeInicial: 25,
        fontSizeMinimo: 19,
        lineHeight: 1.18,
        peso: "regular",
      })
    : null;

  const date = esc(input.dateLabel || new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }));
  const location = esc(input.location || "Laguna - SC");
  const credit = esc(input.photoCredit || "Divulgação");
  const label = esc(theme.label || "CIDADE");
  const parts: string[] = [];

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><clipPath id="official-photo"><rect width="${W}" height="805"/></clipPath><linearGradient id="official-overlay" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${MARCA.primary}" stop-opacity="0"/><stop offset="62%" stop-color="${MARCA.primary}" stop-opacity=".04"/><stop offset="100%" stop-color="${MARCA.primary}" stop-opacity=".88"/></linearGradient></defs>`);
  parts.push(`<rect width="${W}" height="${H}" fill="${MARCA.primary}"/>`);

  if (input.imageUrl) {
    parts.push(`<image href="${esc(input.imageUrl)}" x="0" y="0" width="${W}" height="805" preserveAspectRatio="xMidYMid slice" clip-path="url(#official-photo)"/><rect width="${W}" height="805" fill="url(#official-overlay)"/>`);
  } else {
    parts.push(`<rect width="${W}" height="805" fill="${MARCA.secondary}" opacity=".5"/>`);
  }

  // Cabeçalho fixo.
  parts.push(`<rect x="40" y="30" width="330" height="58" rx="12" fill="${theme.badge === MARCA.accent ? MARCA.accent : MARCA.primary}"/><circle cx="72" cy="59" r="16" fill="${MARCA.accent}"/><text x="102" y="68" font-family="${FONT}" font-size="25" font-weight="900" fill="${theme.badge === MARCA.accent ? MARCA.text : MARCA.white}">${label}</text>`);
  parts.push(`<rect x="770" y="30" width="270" height="58" rx="12" fill="${MARCA.accent}"/><text x="792" y="68" font-family="${FONT}" font-size="21" font-weight="900" fill="${MARCA.text}">${date}</text>`);

  // Painel editorial.
  parts.push(`<path d="M0 ${panelTop} C180 ${panelTop - 18} 350 ${panelTop + 22} 540 ${panelTop - 2} C730 ${panelTop - 28} 900 ${panelTop + 4} 1080 ${panelTop - 10} L1080 1350 L0 1350Z" fill="${MARCA.primary}"/>`);
  parts.push(`<path d="M0 ${panelTop + 2} C220 ${panelTop - 18} 370 ${panelTop + 35} 570 ${panelTop + 4} C770 ${panelTop - 22} 900 ${panelTop + 20} 1080 ${panelTop - 8} L1080 ${panelTop + 55} L0 ${panelTop + 55}Z" fill="${MARCA.primary}" opacity=".96"/>`);

  const titleY = 850;
  parts.push(`<rect x="${safe}" y="${titleY - 50}" width="7" height="150" rx="3" fill="${MARCA.accent}"/>`);
  title.linhas.forEach((line, i) => parts.push(`<text x="${safe + 24}" y="${titleY + i * title.fontSize * title.lineHeight}" font-family="${FONT}" font-size="${title.fontSize}" font-weight="900" fill="${i === title.linhas.length - 1 && title.linhas.length > 1 ? MARCA.accent : MARCA.white}">${esc(line)}</text>`));

  let cursorY = titleY + title.linhas.length * title.fontSize * title.lineHeight + 22;
  if (summary) {
    for (const line of summary.linhas) {
      parts.push(`<text x="${safe + 24}" y="${cursorY}" font-family="${FONT}" font-size="${summary.fontSize}" font-weight="500" fill="${MARCA.white}" opacity=".97">${esc(line)}</text>`);
      cursorY += summary.fontSize * summary.lineHeight;
    }
  }

  // Metadados editoriais ficam acima do rodapé de marca.
  const footerY = 1140;
  parts.push(`<line x1="${safe}" y1="${footerY - 32}" x2="${W - safe}" y2="${footerY - 32}" stroke="${MARCA.secondary}" stroke-width="2" stroke-opacity=".7"/>`);
  parts.push(`<text x="${safe}" y="${footerY + 12}" font-family="${FONT}" font-size="20" font-weight="700" fill="${MARCA.white}">●  ${location}</text><text x="350" y="${footerY + 12}" font-family="${FONT}" font-size="19" font-weight="600" fill="${MARCA.white}">│  Foto: ${credit}</text>`);

  // Ondas inferiores ficam atrás do bloco de assinatura.
  parts.push(`<path d="M0 1288 C230 1250 380 1320 610 1282 C790 1250 920 1270 1080 1238 L1080 1350 L0 1350Z" fill="${MARCA.secondary}" opacity=".95"/><path d="M0 1315 C250 1280 430 1342 680 1305 C850 1280 950 1300 1080 1270" fill="none" stroke="${MARCA.accent}" stroke-width="7"/>`);

  // Bloco de assinatura fixa, no mesmo local do retângulo destacado da referência.
  parts.push(`<rect x="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarX}" y="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarY}" width="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarWidth}" height="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarHeight}" rx="12" fill="${MARCA.secondary}" opacity=".98"/>`);
  parts.push(`<rect x="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarX}" y="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarY}" width="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarWidth}" height="3" rx="1.5" fill="${MARCA.accent}" opacity=".95"/>`);

  // O PNG oficial é colocado como camada real pelo preview/exportador.
  parts.push(`<text x="188" y="1228" font-family="${FONT}" font-size="28" font-weight="900" fill="${MARCA.white}">HORA <tspan fill="${MARCA.accent}">NEWS</tspan></text>`);
  parts.push(`<text x="188" y="1255" font-family="${FONT}" font-size="22" font-weight="800" fill="${MARCA.white}" letter-spacing="3">LAGUNA</text>`);
  parts.push(`<text x="720" y="1218" font-family="${FONT}" font-size="20" font-weight="800" fill="${MARCA.white}">INFORMAÇÃO QUE</text>`);
  parts.push(`<text x="720" y="1248" font-family="${FONT}" font-size="20" font-weight="800" fill="${MARCA.white}">CONECTA NOSSA CIDADE</text>`);

  if (input.sponsorName) {
    parts.push(`<text x="${safe}" y="${H - 88}" font-family="${FONT}" font-size="18" font-weight="800" fill="${MARCA.text}">PUBLICIDADE • ${esc(input.sponsorName)}</text>`);
  }

  parts.push(`</svg>`);
  return parts.join("");
}
