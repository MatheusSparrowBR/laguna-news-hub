import { supabase } from "@/integrations/supabase/client";

export const COMMUNITY_CATEGORIES = [
  "Problema no bairro",
  "Buraco / via danificada",
  "Alagamento",
  "Iluminação pública",
  "Água / esgoto",
  "Lixo / limpeza",
  "Trânsito",
  "Segurança",
  "Animal / resgate",
  "Obra pública",
  "Serviço público",
  "Denúncia",
  "Desaparecimento",
  "Evento comunitário",
  "Informação",
  "Outro",
] as const;

export const COMMUNITY_SOURCES = [
  "Morador",
  "WhatsApp",
  "Instagram",
  "Facebook",
  "Telefone",
  "E-mail",
  "Presencial",
  "Formulário do site",
  "Outro",
] as const;

export const COMMUNITY_STATUSES = [
  "received",
  "triage",
  "verifying",
  "verified",
  "approved",
  "not_confirmed",
  "rejected",
  "converted_to_post",
] as const;

export type CommunityStatus = (typeof COMMUNITY_STATUSES)[number];
export type ConsentMedia = "authorized" | "not_authorized" | "not_informed";
export type PublicationPermission = "yes" | "no" | "pending";
export type CommunityMediaType = "image" | "video";

export interface CommunitySubmission {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  category: string;
  location: string | null;
  neighborhood: string | null;
  occurred_at: string | null;
  source_type: string;
  submitter_name: string | null;
  submitter_phone: string | null;
  submitter_email: string | null;
  consent_media: ConsentMedia;
  publication_permission: PublicationPermission;
  status: CommunityStatus;
  editorial_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityMedia {
  id: string;
  submission_id: string;
  project_id: string;
  media_type: CommunityMediaType;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  caption: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  signed_url?: string;
}

export const STATUS_LABEL: Record<CommunityStatus, string> = {
  received: "Recebida",
  triage: "Triagem",
  verifying: "Em verificação",
  verified: "Verificada",
  approved: "Aprovada",
  not_confirmed: "Não confirmada",
  rejected: "Rejeitada",
  converted_to_post: "Convertida em post",
};

export const STATUS_TONE: Record<CommunityStatus, "default" | "secondary" | "outline" | "destructive"> = {
  received: "secondary",
  triage: "outline",
  verifying: "outline",
  verified: "secondary",
  approved: "default",
  not_confirmed: "outline",
  rejected: "destructive",
  converted_to_post: "default",
};

const IMAGE_RULES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const VIDEO_RULES = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
} as const;

// Limites locais conservadores; a migration não altera limites globais do Storage.
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_MEDIA_FILES = 10;

function extensionFromName(name: string): string {
  return name.toLowerCase().split(".").pop() ?? "";
}

async function readBytes(file: File, length = 16): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(0, length).arrayBuffer());
}

function hasJpegSignature(bytes: Uint8Array) {
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}
function hasPngSignature(bytes: Uint8Array) {
  return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
}
function hasWebpSignature(bytes: Uint8Array) {
  return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
}
function hasMp4Signature(bytes: Uint8Array) {
  return bytes.length >= 8 && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp";
}
function hasWebmSignature(bytes: Uint8Array) {
  return bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
}

async function validateImage(file: File) {
  if (!(file.type in IMAGE_RULES)) throw new Error("Imagem inválida. Use JPG, JPEG, PNG ou WEBP.");
  if (!Object.prototype.hasOwnProperty.call(IMAGE_RULES, file.type)) throw new Error("Formato de imagem não permitido.");
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) throw new Error("A imagem deve ter até 25 MB.");
  const bytes = await readBytes(file);
  const valid = file.type === "image/jpeg" ? hasJpegSignature(bytes) : file.type === "image/png" ? hasPngSignature(bytes) : hasWebpSignature(bytes);
  if (!valid) throw new Error("O conteúdo do arquivo não corresponde ao tipo de imagem informado.");

  if (typeof window === "undefined") return { width: null, height: null };
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      img.src = url;
    });
    if (!img.naturalWidth || !img.naturalHeight) throw new Error("Imagem sem dimensões válidas.");
    return { width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function validateVideo(file: File) {
  if (!(file.type in VIDEO_RULES)) throw new Error("Vídeo inválido. Use MP4, MOV ou WEBM compatível com o navegador.");
  if (file.size <= 0 || file.size > MAX_VIDEO_BYTES) throw new Error("O vídeo deve ter até 100 MB.");
  const bytes = await readBytes(file, 16);
  const valid = file.type === "video/mp4" ? hasMp4Signature(bytes) : file.type === "video/webm" ? hasWebmSignature(bytes) : bytes.length > 0;
  if (!valid) throw new Error("O conteúdo do vídeo não corresponde ao tipo informado.");

  if (typeof window === "undefined") return { width: null, height: null, duration: null };
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "metadata";
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Não foi possível ler o vídeo ou sua integridade."));
      video.src = url;
    });
    return {
      width: video.videoWidth || null,
      height: video.videoHeight || null,
      duration: Number.isFinite(video.duration) ? video.duration : null,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function validarMidia(file: File): Promise<{
  mediaType: CommunityMediaType;
  width: number | null;
  height: number | null;
  duration: number | null;
  extension: string;
}> {
  if (file.type.startsWith("image/")) {
    const dimensions = await validateImage(file);
    return { mediaType: "image", ...dimensions, duration: null, extension: IMAGE_RULES[file.type as keyof typeof IMAGE_RULES] ?? extensionFromName(file.name) };
  }
  if (file.type.startsWith("video/")) {
    const dimensions = await validateVideo(file);
    return { mediaType: "video", ...dimensions, extension: VIDEO_RULES[file.type as keyof typeof VIDEO_RULES] ?? extensionFromName(file.name) };
  }
  throw new Error("Arquivo não suportado. Envie uma imagem JPG/PNG/WEBP ou vídeo MP4/MOV/WEBM.");
}

export async function listarPautas(projectId: string): Promise<CommunitySubmission[]> {
  const { data, error } = await supabase
    .from("community_submissions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CommunitySubmission[];
}

export async function listarMidias(submissionId: string, projectId: string): Promise<CommunityMedia[]> {
  const { data, error } = await supabase
    .from("community_submission_media")
    .select("*")
    .eq("submission_id", submissionId)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });
  if (error) throw error;

  const media = (data ?? []) as unknown as CommunityMedia[];
  return Promise.all(media.map(async (item) => {
    const { data: signed } = await supabase.storage.from("community-submissions").createSignedUrl(item.storage_path, 60 * 60);
    return { ...item, signed_url: signed?.signedUrl };
  }));
}

export async function criarPauta(projectId: string, input: Partial<CommunitySubmission> & { title: string }): Promise<CommunitySubmission> {
  const { data, error } = await supabase.from("community_submissions").insert({
    project_id: projectId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    category: input.category || "Outro",
    location: input.location?.trim() || null,
    neighborhood: input.neighborhood?.trim() || null,
    occurred_at: input.occurred_at || null,
    source_type: input.source_type || "Outro",
    submitter_name: input.submitter_name?.trim() || null,
    submitter_phone: input.submitter_phone?.trim() || null,
    submitter_email: input.submitter_email?.trim() || null,
    consent_media: input.consent_media || "not_informed",
    publication_permission: input.publication_permission || "pending",
    status: "received",
    editorial_notes: input.editorial_notes?.trim() || null,
  } as never).select("*").single();
  if (error) throw error;
  return data as unknown as CommunitySubmission;
}

export async function atualizarPauta(projectId: string, id: string, input: Partial<CommunitySubmission>) {
  const { data: current, error: currentError } = await supabase.from("community_submissions").select("*").eq("id", id).eq("project_id", projectId).single();
  if (currentError) throw currentError;

  const nextStatus = input.status ?? (current as CommunitySubmission).status;
  const { data, error } = await supabase.from("community_submissions").update({
    title: input.title?.trim(),
    description: input.description?.trim() || null,
    category: input.category,
    location: input.location?.trim() || null,
    neighborhood: input.neighborhood?.trim() || null,
    occurred_at: input.occurred_at || null,
    source_type: input.source_type,
    submitter_name: input.submitter_name?.trim() || null,
    submitter_phone: input.submitter_phone?.trim() || null,
    submitter_email: input.submitter_email?.trim() || null,
    consent_media: input.consent_media,
    publication_permission: input.publication_permission,
    status: nextStatus,
    editorial_notes: input.editorial_notes?.trim() || null,
    reviewed_at: ["verifying", "verified", "approved", "rejected", "not_confirmed", "converted_to_post"].includes(nextStatus) ? new Date().toISOString() : current.reviewed_at,
    reviewed_by: ["verifying", "verified", "approved", "rejected", "not_confirmed", "converted_to_post"].includes(nextStatus) ? (await supabase.auth.getUser()).data.user?.id ?? null : current.reviewed_by,
  } as never).eq("id", id).eq("project_id", projectId).select("*").single();
  if (error) throw error;
  return data as unknown as CommunitySubmission;
}

export async function adicionarMidias(params: {
  projectId: string;
  submissionId: string;
  files: File[];
}): Promise<CommunityMedia[]> {
  if (params.files.length === 0) return [];
  if (params.files.length > MAX_MEDIA_FILES) throw new Error(`Você pode adicionar no máximo ${MAX_MEDIA_FILES} arquivos por pauta.`);

  const existing = await listarMidias(params.submissionId, params.projectId);
  if (existing.length + params.files.length > MAX_MEDIA_FILES) throw new Error(`Esta pauta já possui ${existing.length} arquivos. O limite é ${MAX_MEDIA_FILES}.`);

  const results: CommunityMedia[] = [];
  for (const file of params.files) {
    const validation = await validarMidia(file);
    const storagePath = `${params.projectId}/community/${params.submissionId}/${crypto.randomUUID()}.${validation.extension}`;
    const { error: uploadError } = await supabase.storage.from("community-submissions").upload(storagePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) throw new Error(`Não foi possível enviar ${file.name}: ${uploadError.message}`);

    const { data, error } = await supabase.from("community_submission_media").insert({
      submission_id: params.submissionId,
      project_id: params.projectId,
      media_type: validation.mediaType,
      storage_path: storagePath,
      original_filename: file.name.slice(0, 255),
      mime_type: file.type,
      file_size: file.size,
      width: validation.width,
      height: validation.height,
      duration: validation.duration,
      sort_order: existing.length + results.length,
      is_primary: existing.length === 0 && results.length === 0,
    } as never).select("*").single();

    if (error) {
      await supabase.storage.from("community-submissions").remove([storagePath]);
      throw new Error(`Arquivo enviado, mas não foi registrado: ${error.message}`);
    }
    const { data: signed } = await supabase.storage.from("community-submissions").createSignedUrl(storagePath, 60 * 60);
    results.push({ ...(data as unknown as CommunityMedia), signed_url: signed?.signedUrl });
  }
  return results;
}

export async function definirMidiaPrincipal(projectId: string, submissionId: string, mediaId: string) {
  const { error: clearError } = await supabase.from("community_submission_media").update({ is_primary: false } as never).eq("submission_id", submissionId).eq("project_id", projectId);
  if (clearError) throw clearError;
  const { error } = await supabase.from("community_submission_media").update({ is_primary: true } as never).eq("id", mediaId).eq("submission_id", submissionId).eq("project_id", projectId);
  if (error) throw error;
}

export async function removerMidia(projectId: string, submissionId: string, mediaId: string) {
  const { data: media, error } = await supabase.from("community_submission_media").select("storage_path").eq("id", mediaId).eq("submission_id", submissionId).eq("project_id", projectId).single();
  if (error) throw error;
  const path = (media as unknown as { storage_path: string }).storage_path;
  await supabase.storage.from("community-submissions").remove([path]);
  const { error: deleteError } = await supabase.from("community_submission_media").delete().eq("id", mediaId).eq("submission_id", submissionId).eq("project_id", projectId);
  if (deleteError) throw deleteError;
}

export async function criarPostDaPauta(projectId: string, submission: CommunitySubmission, media: CommunityMedia | null) {
  if (submission.status !== "approved") throw new Error("A pauta precisa estar aprovada antes de criar uma publicação.");
  if (submission.publication_permission !== "yes") throw new Error("A permissão de publicação da pauta não está autorizada.");

  const { data: post, error } = await supabase.from("posts").insert({
    project_id: projectId,
    community_submission_id: submission.id,
    post_type: "feed",
    title: "",
    caption: "",
    image_url: media?.signed_url ?? null,
    status: "draft",
    template_key: "comunidade",
    channel: "instagram",
  } as never).select("*").single();
  if (error) throw error;
  return post as unknown as { id: string };
}

export function possuiConteudoSensivel(submission: CommunitySubmission, media: CommunityMedia[] = []) {
  const text = `${submission.title} ${submission.description ?? ""} ${submission.category} ${media.map((m) => m.original_filename).join(" ")}`.toLowerCase();
  return ["criança", "crianca", "acidente", "violência", "violencia", "sangue", "morto", "morte", "arma", "agressão", "agressao"].some((term) => text.includes(term));
}
