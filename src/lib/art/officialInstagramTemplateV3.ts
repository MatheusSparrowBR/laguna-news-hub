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
 * Template oficial do Feed HORA NEWS LAGUNA.
 * A fotografia é preservada como elemento principal: sem blur, sem escala fixa
 * de thumbnail e com crop proporcional 4:5. Os overlays existem somente para
 * garantir contraste editorial e identidade visual.
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

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderPhotoBackground(imageUrl: string, width: number, height: number): string {
  return `<image href="${esc(imageUrl)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`;
}

export function renderOfficialInstagramSvg(input: OfficialInstagramArtInput): string {
  const W = OFFICIAL_INSTAGRAM_TEMPLATE.width;
  const H = OFFICIAL_INSTAGRAM_TEMPLATE.height;
  const safe = SAFE_AREA;
  const theme = temaDoTemplate(input.template);
  const panelTop = 760;

  const title = ajustarTexto(input.title || "Título da publicação", {
    larguraMax: W - safe * 2 - 28,
    alturaMax: 182,
    fontSizeInicial: 62,
    fontSizeMinimo: 36,
    lineHeight: 1.03,
    peso: "bold",
  });

  const summary = input.summary
    ? ajustarTexto(input.summary, {
        larguraMax: W - safe * 2 - 28,
        alturaMax: 128,
        fontSizeInicial: 25,
        fontSizeMinimo: 18,
        lineHeight: 1.18,
        peso: "regular",
      })
    : null;

  const date = esc(
    input.dateLabel ||
      new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
  );
  const location = esc(input.location || "Laguna - SC");
  const credit = esc(input.photoCredit || "Crédito não informado");
  const label = esc(theme.label || "CIDADE");
  const parts: string[] = [];

  parts.push(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="hora-photo-overlay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${MARCA.primary}" stop-opacity="0" />
          <stop offset="48%" stop-color="${MARCA.primary}" stop-opacity="0.02" />
          <stop offset="68%" stop-color="${MARCA.primary}" stop-opacity="0.10" />
          <stop offset="100%" stop-color="${MARCA.primary}" stop-opacity="0.56" />
        </linearGradient>
        <clipPath id="hora-branding-clip">
          <rect x="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarX}" y="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarY}" width="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarWidth}" height="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarHeight}" rx="12" />
        </clipPath>
      </defs>`);

  if (input.imageUrl) {
    parts.push(renderPhotoBackground(input.imageUrl, W, H));
    parts.push(`<rect width="${W}" height="${H}" fill="url(#hora-photo-overlay)"/>`);
  } else {
    parts.push(`<rect width="${W}" height="${H}" fill="${MARCA.primary}"/>`);
  }

  // Cabeçalho fixo, leve o suficiente para não esconder a fotografia.
  parts.push(
    `<rect x="40" y="30" width="330" height="58" rx="12" fill="${MARCA.primary}" opacity="0.94"/>` +
      `<circle cx="72" cy="59" r="16" fill="${MARCA.accent}"/>` +
      `<text x="102" y="68" font-family="${FONT}" font-size="25" font-weight="900" fill="${MARCA.white}">${label}</text>`,
  );
  parts.push(
    `<rect x="770" y="30" width="270" height="58" rx="12" fill="${MARCA.accent}" opacity="0.97"/>` +
      `<text x="792" y="68" font-family="${FONT}" font-size="21" font-weight="900" fill="${MARCA.text}">${date}</text>`,
  );

  // Painel editorial translúcido: mantém a foto nítida e visível atrás do texto.
  parts.push(
    `<path d="M0 ${panelTop} C180 ${panelTop - 18} 350 ${panelTop + 20} 540 ${panelTop - 2} C730 ${panelTop - 24} 900 ${panelTop + 2} ${W} ${panelTop - 10} L${W} ${H} L0 ${H}Z" fill="${MARCA.primary}" opacity="0.38"/>`,
  );
  parts.push(
    `<path d="M0 ${panelTop + 10} C220 ${panelTop - 12} 390 ${panelTop + 28} 570 ${panelTop + 5} C760 ${panelTop - 18} 920 ${panelTop + 16} ${W} ${panelTop - 4} L${W} ${panelTop + 52} L0 ${panelTop + 52}Z" fill="${MARCA.secondary}" opacity="0.12"/>`,
  );

  const titleY = 850;
  parts.push(`<rect x="${safe}" y="${titleY - 50}" width="7" height="150" rx="3" fill="${MARCA.accent}"/>`);
  title.linhas.forEach((line, index) => {
    const fill = index === title.linhas.length - 1 && title.linhas.length > 1 ? MARCA.accent : MARCA.white;
    parts.push(
      `<text x="${safe + 24}" y="${titleY + index * title.fontSize * title.lineHeight}" font-family="${FONT}" font-size="${title.fontSize}" font-weight="900" fill="${fill}">${esc(line)}</text>`,
    );
  });

  let cursorY = titleY + title.linhas.length * title.fontSize * title.lineHeight + 22;
  if (summary) {
    for (const line of summary.linhas) {
      parts.push(
        `<text x="${safe + 24}" y="${cursorY}" font-family="${FONT}" font-size="${summary.fontSize}" font-weight="500" fill="${MARCA.white}" opacity="0.97">${esc(line)}</text>`,
      );
      cursorY += summary.fontSize * summary.lineHeight;
    }
  }

  const footerY = 1140;
  parts.push(`<line x1="${safe}" y1="${footerY - 32}" x2="${W - safe}" y2="${footerY - 32}" stroke="${MARCA.secondary}" stroke-width="2" stroke-opacity="0.72"/>`);
  parts.push(
    `<text x="${safe}" y="${footerY + 12}" font-family="${FONT}" font-size="20" font-weight="700" fill="${MARCA.white}">● ${location}</text>` +
      `<text x="350" y="${footerY + 12}" font-family="${FONT}" font-size="19" font-weight="600" fill="${MARCA.white}">│ Foto: ${credit}</text>`,
  );

  // Ondas discretas ficam atrás da assinatura da marca.
  parts.push(
    `<path d="M0 1288 C230 1250 380 1320 610 1282 C790 1250 920 1270 ${W} 1238 L${W} ${H} L0 ${H}Z" fill="${MARCA.secondary}" opacity="0.42"/>`,
  );
  parts.push(
    `<path d="M0 1315 C250 1280 430 1342 680 1305 C850 1280 950 1300 ${W} 1270" fill="none" stroke="${MARCA.accent}" stroke-width="7" opacity="0.96"/>`,
  );

  // Rodapé de branding com fotografia + overlay suave, evitando bloco azul chapado.
  if (input.imageUrl) {
    parts.push(renderPhotoBackground(input.imageUrl, W, H).replace("</image>", "") + "");
  }
  parts.push(
    `<rect x="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarX}" y="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarY}" width="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarWidth}" height="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarHeight}" rx="12" fill="${MARCA.secondary}" opacity="0.48" clip-path="url(#hora-branding-clip)"/>`,
  );
  parts.push(`<rect x="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarX}" y="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarY}" width="${OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarWidth}" height="3" rx="1.5" fill="${MARCA.accent}" opacity="0.96"/>`);

  parts.push(`<text x="188" y="1228" font-family="${FONT}" font-size="28" font-weight="900" fill="${MARCA.white}">HORA <tspan fill="${MARCA.accent}">NEWS</tspan></text>`);
  parts.push(`<text x="188" y="1255" font-family="${FONT}" font-size="22" font-weight="800" fill="${MARCA.white}" letter-spacing="3">LAGUNA</text>`);
  parts.push(`<text x="720" y="1218" font-family="${FONT}" font-size="20" font-weight="800" fill="${MARCA.white}">INFORMAÇÃO QUE</text>`);
  parts.push(`<text x="720" y="1248" font-family="${FONT}" font-size="20" font-weight="800" fill="${MARCA.white}">CONECTA NOSSA CIDADE</text>`);

  if (input.sponsorName) {
    parts.push(`<text x="${safe}" y="${H - 88}" font-family="${FONT}" font-size="18" font-weight="800" fill="${MARCA.white}">PUBLICIDADE • ${esc(input.sponsorName)}</text>`);
  }

  parts.push(`</svg>`);
  return parts.join("");
}
