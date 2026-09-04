/**
 * Endereço temporário da arte para o Instagram — SERVER-ONLY.
 *
 * O bucket "social-assets" continua PRIVADO. Geramos uma URL assinada com
 * validade suficiente para a publicação e conferimos se ela está acessível.
 * A publicação do Instagram usa APENAS o asset `rendered_art`, garantindo
 * que nenhuma foto original seja publicada sem a identidade oficial.
 */
import { criarClienteAdmin } from "@/lib/adminClient.server";

const BUCKET = "social-assets";
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
 * Resolve SOMENTE a arte final renderizada do post.
 * Um `source_image` nunca pode substituir a arte oficial no fluxo do Instagram.
 */
export async function resolverAssetDoPost(entrada: {
  postId: string;
  imageUrl: string | null;
}): Promise<AssetResolvido> {
  const admin = criarClienteAdmin();
  const { data: asset, error: assetError } = await admin
    .from("post_assets")
    .select("storage_path, mime_type, width, height, file_size, asset_type")
    .eq("post_id", entrada.postId)
    .eq("asset_type", "rendered_art")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assetError) return falha("Não foi possível localizar a arte final da publicação.");
  const expiraEm = new Date(Date.now() + VALIDADE_SEGUNDOS * 1000).toISOString();

  if (!asset?.storage_path) {
    return falha("Gere e salve a arte oficial HORA NEWS LAGUNA antes de publicar no Instagram.");
  }

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
    mimeType: asset.mime_type ?? "image/png",
    width: asset.width ?? 1080,
    height: asset.height ?? 1350,
    fileSize: asset.file_size ?? null,
    expiraEm,
    erro: null,
  };
}

async function urlAcessivel(url: string): Promise<boolean> {
  try {
    const resposta = await fetch(url, { method: "HEAD" });
    if (resposta.ok) return true;
    // Alguns proxies/CDNs não respondem HEAD corretamente; GET com range é
    // uma verificação pequena e ainda confirma que a URL é publicamente acessível.
    const fallback = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-255" },
    });
    return fallback.ok || fallback.status === 206;
  } catch {
    return false;
  }
}
