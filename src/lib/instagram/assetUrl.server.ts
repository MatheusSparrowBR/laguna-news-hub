/**
 * Endereço temporário da arte para o Instagram — SERVER-ONLY.
 *
 * O bucket "social-assets" continua PRIVADO. Geramos uma URL assinada com
 * validade suficiente para a publicação e conferimos se ela está acessível
 * antes de tentar publicar.
 */
import { criarClienteAdmin } from "@/lib/adminClient.server";

const BUCKET = "social-assets";
/** 1 hora: bem acima do tempo de uma publicação. */
export const VALIDADE_SEGUNDOS = 3600;

export interface AssetResolvido {
  ok: boolean;
  publicUrl: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  expiraEm: string | null;
  erro: string | null;
}

function falha(erro: string): AssetResolvido {
  return {
    ok: false,
    publicUrl: null,
    mimeType: null,
    width: null,
    height: null,
    fileSize: null,
    expiraEm: null,
    erro,
  };
}

/**
 * Resolve a arte de um post: usa o asset gravado em post_assets (URL assinada)
 * e, na ausência dele, uma imagem já hospedada em https.
 */
export async function resolverAssetDoPost(entrada: {
  postId: string;
  imageUrl: string | null;
}): Promise<AssetResolvido> {
  const admin = criarClienteAdmin();
  const { data: asset } = await admin
    .from("post_assets")
    .select("storage_path, mime_type, width, height, file_size")
    .eq("post_id", entrada.postId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const expiraEm = new Date(Date.now() + VALIDADE_SEGUNDOS * 1000).toISOString();

  if (asset?.storage_path) {
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(asset.storage_path, VALIDADE_SEGUNDOS);
    if (error || !data?.signedUrl) {
      return falha("A arte não pôde ser preparada para publicação.");
    }
    const acessivel = await urlAcessivel(data.signedUrl);
    if (!acessivel) return falha("A arte não está acessível para o Instagram.");
    return {
      ok: true,
      publicUrl: data.signedUrl,
      mimeType: asset.mime_type ?? "image/jpeg",
      width: asset.width ?? null,
      height: asset.height ?? null,
      fileSize: asset.file_size ?? null,
      expiraEm,
      erro: null,
    };
  }

  if (entrada.imageUrl && entrada.imageUrl.startsWith("https://")) {
    const acessivel = await urlAcessivel(entrada.imageUrl);
    if (!acessivel) return falha("A imagem informada não está acessível publicamente.");
    return {
      ok: true,
      publicUrl: entrada.imageUrl,
      mimeType: "image/jpeg",
      width: 1080,
      height: 1080,
      fileSize: null,
      expiraEm,
      erro: null,
    };
  }

  return falha("Este conteúdo ainda não tem arte para publicar.");
}

async function urlAcessivel(url: string): Promise<boolean> {
  try {
    const resposta = await fetch(url, { method: "HEAD" });
    return resposta.ok;
  } catch {
    return false;
  }
}
