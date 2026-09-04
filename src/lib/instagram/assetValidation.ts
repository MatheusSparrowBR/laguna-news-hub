/**
 * Validação de mídia para publicação (FASE 34) — pura e determinística.
 *
 * A arquitetura impede tentar publicar asset sem URL pública acessível.
 */

export type MediaKind = "image" | "carousel" | "reel";

export const MEDIA_KINDS: readonly MediaKind[] = ["image", "carousel", "reel"] as const;

export const MIME_ACEITOS = ["image/jpeg", "image/png"] as const;
export const TAMANHO_MAX_BYTES = 8 * 1024 * 1024;
export const LADO_MIN = 320;
export const LADO_MAX = 1440;
export const PROPORCAO_MIN = 0.4;
export const PROPORCAO_MAX = 1.91;

export interface AssetParaPublicacao {
  publicUrl?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  fileSize?: number | null;
}

export interface ResultadoValidacaoAsset {
  ok: boolean;
  erros: string[];
  /** Código estável do primeiro erro — usado pela política de retry. */
  codigo: string | null;
}

function urlPublicaValida(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(parsed.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

/** Valida o asset antes de qualquer tentativa de publicação. */
export function validarAsset(asset: AssetParaPublicacao): ResultadoValidacaoAsset {
  const erros: string[] = [];
  let codigo: string | null = null;

  const registrar = (mensagem: string, code: string): void => {
    erros.push(mensagem);
    codigo = codigo ?? code;
  };

  if (!asset.publicUrl || !urlPublicaValida(asset.publicUrl)) {
    registrar("A arte precisa de um endereço público em https para ser publicada.", "asset_not_public");
  }

  const mime = (asset.mimeType ?? "").toLowerCase();
  if (!MIME_ACEITOS.includes(mime as (typeof MIME_ACEITOS)[number])) {
    registrar("Formato de imagem não aceito: use JPG ou PNG.", "unsupported_format");
  }

  const { width, height } = asset;
  if (!width || !height) {
    registrar("As dimensões da arte não foram informadas.", "invalid_dimensions");
  } else {
    if (width < LADO_MIN || height < LADO_MIN || width > LADO_MAX || height > LADO_MAX) {
      registrar(
        `As dimensões devem ficar entre ${LADO_MIN} e ${LADO_MAX} pixels.`,
        "invalid_dimensions",
      );
    }
    const proporcao = width / height;
    if (proporcao < PROPORCAO_MIN || proporcao > PROPORCAO_MAX) {
      registrar("A proporção da arte está fora do aceito para publicação.", "invalid_dimensions");
    }
  }

  if (asset.fileSize != null && asset.fileSize > TAMANHO_MAX_BYTES) {
    registrar("O arquivo da arte passa do tamanho máximo de 8 MB.", "invalid_media");
  }

  return { ok: erros.length === 0, erros, codigo };
}
