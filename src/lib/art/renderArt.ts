import type { TemplateKey } from "@/lib/templates/postTemplates";
import { DIMENSOES, type ArtFormat } from "./artTemplates";
import { renderOfficialInstagramSvg } from "./officialInstagramTemplateV2";

export interface EntradaArte { template: TemplateKey; format: ArtFormat; title: string; subtitle?: string | null; imageUrl?: string | null; sourceName?: string | null; dateLabel?: string | null; sponsorName?: string | null; sponsorLogoUrl?: string | null; cta?: string | null; }
export function escaparXml(texto: string): string { return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;"); }
/** Feed 1080×1350 usa obrigatoriamente a arte oficial fixa HORA NEWS LAGUNA. */
export function renderizarArteSvg(entrada: EntradaArte): string {
  if (entrada.format === "feed") return renderOfficialInstagramSvg({ template: entrada.template, title: entrada.title, summary: entrada.subtitle, imageUrl: entrada.imageUrl, dateLabel: entrada.dateLabel, location: "Laguna - SC", photoCredit: entrada.sponsorName ? `Publicidade • ${entrada.sponsorName}` : (entrada.sourceName ?? "Divulgação"), sponsorName: entrada.sponsorName });
  const { width, height } = DIMENSOES[entrada.format];
  const image = entrada.imageUrl ? `<image href="${escaparXml(entrada.imageUrl)}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>` : `<rect width="${width}" height="${height}" fill="#0B3D91"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${image}<rect x="40" y="${height - 420}" width="${width - 80}" height="360" rx="24" fill="#0B3D91" opacity=".92"/><text x="70" y="${height - 270}" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="900" fill="#FFFFFF">${escaparXml(entrada.title)}</text><text x="70" y="${height - 100}" font-family="Inter, Arial, sans-serif" font-size="24" fill="#FFC107">HORA NEWS LAGUNA</text></svg>`;
}
export function svgParaDataUrl(svg: string): string { return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; }

/**
 * Blob URL mantém a origem do documento no SVG. Isso permite que imagens
 * locais do template, como a logo PNG oficial, sejam carregadas pelo browser
 * tanto no preview quanto no Canvas, ao contrário de referências locais dentro
 * de data:image/svg+xml em alguns navegadores.
 */
export function svgParaBlobUrl(svg: string): string {
  if (typeof URL === "undefined" || typeof Blob === "undefined") {
    throw new Error("Blob URLs não estão disponíveis neste ambiente.");
  }
  return URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
}
