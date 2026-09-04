import type { TemplateKey } from "@/lib/templates/postTemplates";
import { DIMENSOES, type ArtFormat } from "./artTemplates";
import { renderOfficialInstagramSvg } from "./officialInstagramTemplateV2";

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
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * O formato Feed 1080×1350 usa obrigatoriamente a arte oficial HORA NEWS LAGUNA.
 * Outros formatos ficam fora desta identidade fixa para preservar compatibilidade.
 */
export function renderizarArteSvg(entrada: EntradaArte): string {
  if (entrada.format === "feed") {
    return renderOfficialInstagramSvg({
      template: entrada.template,
      title: entrada.title,
      summary: entrada.subtitle,
      imageUrl: entrada.imageUrl,
      dateLabel: entrada.dateLabel,
      location: "Laguna - SC",
      photoCredit: entrada.sponsorName
        ? `Publicidade • ${entrada.sponsorName}`
        : entrada.sourceName ?? "Divulgação",
      sponsorName: entrada.sponsorName,
    });
  }

  const { width, height } = DIMENSOES[entrada.format];
  const image = entrada.imageUrl
    ? `<image href="${escaparXml(entrada.imageUrl)}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect width="${width}" height="${height}" fill="#0B3D91"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${image}</svg>`;
}

export function svgParaDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
