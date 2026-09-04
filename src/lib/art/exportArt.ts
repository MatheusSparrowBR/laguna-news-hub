/**
 * Exportação da arte: SVG → PNG/JPG via Canvas (browser).
 * A logo oficial é desenhada como imagem separada no Canvas para não depender
 * de hrefs locais dentro do SVG Blob.
 */

import { DIMENSOES, type ArtFormat } from "./artTemplates";
import { svgParaBlobUrl } from "./renderArt";
import { OFFICIAL_INSTAGRAM_TEMPLATE } from "./officialInstagramTemplateV3";
import { OFFICIAL_INSTAGRAM_STORY_TEMPLATE } from "./officialInstagramStoryTemplate";

export type ArtMimeType = "image/png" | "image/jpeg";
export interface ArquivoArte { blob: Blob; mimeType: ArtMimeType; width: number; height: number; extensao: "png" | "jpg"; }

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Não foi possível carregar a imagem da arte: ${src}`));
    img.src = src;
  });
}

async function desenharLogoOficial(ctx: CanvasRenderingContext2D, format: ArtFormat): Promise<void> {
  const logo = format === "feed" ? OFFICIAL_INSTAGRAM_TEMPLATE : format === "story" ? OFFICIAL_INSTAGRAM_STORY_TEMPLATE : null;
  if (!logo) return;
  const imagemLogo = await carregarImagem(logo.logoPath);
  ctx.drawImage(imagemLogo, logo.logoX, logo.logoY, logo.logoWidth, logo.logoHeight);
}

/** Converte o SVG da arte em PNG ou JPG e adiciona a logo PNG oficial como camada real. */
export async function exportarArte(svg: string, format: ArtFormat, mimeType: ArtMimeType = "image/png"): Promise<ArquivoArte> {
  if (typeof document === "undefined") throw new Error("A exportação da arte só está disponível no navegador.");
  const { width, height } = DIMENSOES[format];
  const svgUrl = svgParaBlobUrl(svg);
  try {
    const img = await carregarImagem(svgUrl);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível neste navegador.");
    if (mimeType === "image/jpeg") { ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, width, height); }
    ctx.drawImage(img, 0, 0, width, height);
    await desenharLogoOficial(ctx, format);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, mimeType === "image/jpeg" ? 0.92 : undefined));
    if (!blob) throw new Error("Não foi possível gerar o arquivo da arte.");
    return { blob, mimeType, width, height, extensao: mimeType === "image/jpeg" ? "jpg" : "png" };
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function baixarArquivo(arquivo: ArquivoArte, nomeBase: string): void {
  const url = URL.createObjectURL(arquivo.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${nomeBase}.${arquivo.extensao}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
