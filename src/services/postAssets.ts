import { supabase } from "@/integrations/supabase/client";

const BUCKET = "social-assets";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface AssetUploadResult {
  id: string;
  storagePath: string;
  signedUrl: string;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
}

function extensionFromMime(mimeType: string): "jpg" | "png" | "webp" {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

async function readImageDimensions(file: Blob): Promise<{ width: number; height: number }> {
  if (typeof window === "undefined") {
    throw new Error("O upload de imagem só está disponível no navegador.");
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("O arquivo não contém uma imagem válida."));
      img.src = url;
    });
    if (!img.naturalWidth || !img.naturalHeight) {
      throw new Error("Não foi possível validar as dimensões da imagem.");
    }
    return { width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function validarImagem(file: File): Promise<{ width: number; height: number }> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("Formato não suportado. Use JPG, JPEG, PNG ou WEBP.");
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error("A imagem deve ter até 10 MB.");
  }
  return readImageDimensions(file);
}

/** Upload privado, isolado pelo projeto. O banco guarda apenas o caminho e metadados. */
export async function enviarImagemPost(params: {
  projectId: string;
  postId: string;
  file: File;
  assetType?: string;
}): Promise<AssetUploadResult> {
  const { projectId, postId, file, assetType = "source_image" } = params;
  const { width, height } = await validarImagem(file);
  const extension = extensionFromMime(file.type);
  const storagePath = `${projectId}/posts/${postId}/${assetType}-${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw new Error(`Não foi possível enviar a imagem: ${uploadError.message}`);

  const { data: signed, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60);
  if (signedError || !signed?.signedUrl) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw new Error("Imagem enviada, mas não foi possível criar a URL privada de visualização.");
  }

  const { data: asset, error: assetError } = await supabase
    .from("post_assets")
    .insert({
      post_id: postId,
      asset_type: assetType,
      storage_path: storagePath,
      public_url: null,
      mime_type: file.type,
      file_size: file.size,
      width,
      height,
    } as never)
    .select("id")
    .single();

  if (assetError) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw new Error(`Imagem enviada, mas não foi possível registrar o asset: ${assetError.message}`);
  }

  return {
    id: asset.id,
    storagePath,
    signedUrl: signed.signedUrl,
    width,
    height,
    fileSize: file.size,
    mimeType: file.type,
  };
}

/** Persiste uma arte PNG/JPG já gerada no navegador. */
export async function salvarArteGerada(params: {
  projectId: string;
  postId: string;
  blob: Blob;
  width: number;
  height: number;
  extension?: "png" | "jpg";
}): Promise<AssetUploadResult> {
  const extension = params.extension ?? "png";
  const mimeType = extension === "jpg" ? "image/jpeg" : "image/png";
  const file = new File([params.blob], `hora-news.${extension}`, { type: mimeType });
  const result = await enviarImagemPost({
    projectId: params.projectId,
    postId: params.postId,
    file,
    assetType: "rendered_art",
  });
  return { ...result, width: params.width, height: params.height };
}
