/**
 * Exportação da arte: SVG → PNG/JPG via Canvas (browser).
 *
 * Sem serviço externo e sem IA. Só roda no navegador (usa Image/Canvas).
 */

import { DIMENSOES, type ArtFormat } from "./artTemplates";
import { svgParaBlobUrl } from "./renderArt";

export type ArtMimeType = "image/png" | "image/jpeg";

export interface ArquivoArte {
  blob: Blob;
  mimeType: ArtMimeType;
  width: number;
  height: number;
  extensao: "png" | "jpg";
}

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível carregar a imagem da arte."));
    img.src = src;
  });
}

/** Converte o SVG da arte em um arquivo PNG ou JPG. */
export async function exportarArte(
  svg: string,
  format: ArtFormat,
  mimeType: ArtMimeType = "image/png",
): Promise<ArquivoArte> {
  if (typeof document === "undefined") {
    throw new Error("A exportação da arte só está disponível no navegador.");
  }
  const { width, height } = DIMENSOES[format];
  const svgUrl = svgParaBlobUrl(svg);
  try {
    const img = await carregarImagem(svgUrl);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível neste navegador.");

    if (mimeType === "image/jpeg") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mimeType, mimeType === "image/jpeg" ? 0.92 : undefined),
    );
    if (!blob) throw new Error("Não foi possível gerar o arquivo da arte.");

    return {
      blob,
      mimeType,
      width,
      height,
      extensao: mimeType === "image/jpeg" ? "jpg" : "png",
    };
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

/** Dispara o download local do arquivo gerado. */
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
