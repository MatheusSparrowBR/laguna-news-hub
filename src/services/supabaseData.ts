import { supabase } from "@/integrations/supabase/client";
import { CATEGORIAS } from "@/lib/types";
import type {
  Categoria,
  DailyMetric,
  Importancia,
  NewsItem,
  NewsStatus,
  Publication,
  PublicationStatus,
  Source,
} from "@/lib/types";

/**
 * Camada de acesso ao banco (Lovable Cloud).
 * As linhas do banco são convertidas para os mesmos tipos que as telas
 * já usavam, para não precisar refazer nenhuma tela.
 */

export interface ProjetoAtual {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  profile_name: string | null;
  instagram_username: string | null;
  active: boolean;
}

export interface ConfiguracoesProjeto {
  auto_publish_enabled: boolean;
  approval_required: boolean;
  max_posts_per_day: number;
  minimum_confidence: number;
  minimum_interval_minutes: number;
}

export interface CategoriaBanco {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

export interface FonteBanco extends Source {
  categoryId: string | null;
  rssUrl: string | null;
}

const statusDoBanco: Record<string, NewsStatus> = {
  new: "nova",
  analyzing: "em_analise",
  awaiting_approval: "aguardando_aprovacao",
  approved: "aprovada",
  published: "publicada",
  ignored: "ignorada",
  duplicate: "duplicada",
  review_required: "revisao_obrigatoria",
};

export const statusParaBanco: Record<NewsStatus, string> = {
  nova: "new",
  em_analise: "analyzing",
  aguardando_aprovacao: "awaiting_approval",
  aprovada: "approved",
  publicada: "published",
  ignorada: "ignored",
  duplicada: "duplicate",
  revisao_obrigatoria: "review_required",
  rejeitada: "ignored",
};

const statusPostDoBanco: Record<string, PublicationStatus> = {
  draft: "rascunho",
  scheduled: "agendada",
  publishing: "agendada",
  published: "publicada",
  failed: "erro",
  cancelled: "erro",
};

function importanciaPorNota(nota: number): Importancia {
  if (nota >= 9) return "urgente";
  if (nota >= 7) return "alta";
  if (nota >= 4) return "media";
  return "baixa";
}

function categoriaValida(nome: string | null | undefined): Categoria {
  const encontrada = CATEGORIAS.find((c) => c === nome);
  return encontrada ?? "Cidade";
}

/** Garante o perfil do administrador e devolve o projeto dele. */
export async function obterProjetoAtual(): Promise<ProjetoAtual | null> {
  const { error: erroRpc } = await supabase.rpc("claim_admin_project", { _name: undefined });
  if (erroRpc) throw erroRpc;

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, city, state, country, profile_name, instagram_username, active")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function obterCategorias(): Promise<CategoriaBanco[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, active")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function obterConfiguracoes(projectId: string): Promise<ConfiguracoesProjeto | null> {
  const { data, error } = await supabase
    .from("settings")
    .select(
      "auto_publish_enabled, approval_required, max_posts_per_day, minimum_confidence, minimum_interval_minutes",
    )
    .eq("project_id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function salvarConfiguracoes(
  projectId: string,
  valores: Partial<ConfiguracoesProjeto>,
) {
  const { error } = await supabase.from("settings").update(valores).eq("project_id", projectId);
  if (error) throw error;
}

export async function salvarProjeto(
  projectId: string,
  valores: Partial<Pick<ProjetoAtual, "name" | "profile_name" | "instagram_username">>,
) {
  const { error } = await supabase.from("projects").update(valores).eq("id", projectId);
  if (error) throw error;
}

export async function obterFontes(projectId: string): Promise<FonteBanco[]> {
  const { data, error } = await supabase
    .from("sources")
    .select("id, name, url, source_type, rss_url, category_id, active, last_checked_at, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const { data: contagem, error: erroContagem } = await supabase
    .from("news")
    .select("source_id")
    .eq("project_id", projectId);
  if (erroContagem) throw erroContagem;

  const porFonte = new Map<string, number>();
  (contagem ?? []).forEach((n) => {
    if (n.source_id) porFonte.set(n.source_id, (porFonte.get(n.source_id) ?? 0) + 1);
  });

  return (data ?? []).map((f) => ({
    id: f.id,
    nome: f.name,
    url: f.url,
    tipo: f.source_type === "rss" ? "rss" : "site",
    ativa: f.active,
    ultimaColeta: f.last_checked_at ?? f.created_at,
    noticiasColetadas: porFonte.get(f.id) ?? 0,
    categoryId: f.category_id,
    rssUrl: f.rss_url,
  }));
}

export async function criarFonte(
  projectId: string,
  valores: { name: string; url: string; source_type: string; rss_url?: string | null },
) {
  const { error } = await supabase.from("sources").insert({ project_id: projectId, ...valores });
  if (error) throw error;
}

export async function alterarFonteAtiva(id: string, active: boolean) {
  const { error } = await supabase.from("sources").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function removerFonte(id: string) {
  const { error } = await supabase.from("sources").delete().eq("id", id);
  if (error) throw error;
}

const SELECT_NEWS = `
  id, title, original_content, source_url, image_url, city, state,
  importance_score, ai_confidence, is_duplicate, duplicate_group_id,
  status, published_at, discovered_at, is_demo,
  categories ( name ),
  sources ( name ),
  news_analysis ( summary, instagram_title, instagram_caption, hashtags, suggested_art_text, moderation_status, moderation_notes )
`;

type LinhaNews = {
  id: string;
  title: string;
  original_content: string | null;
  source_url: string | null;
  image_url: string | null;
  city: string | null;
  state: string | null;
  importance_score: number | string;
  ai_confidence: number;
  is_duplicate: boolean;
  duplicate_group_id: string | null;
  status: string;
  published_at: string | null;
  discovered_at: string;
  is_demo: boolean;
  categories: { name: string } | null;
  sources: { name: string } | null;
  news_analysis:
    | {
        summary: string | null;
        instagram_title: string | null;
        instagram_caption: string | null;
        hashtags: string | null;
        suggested_art_text: string | null;
        moderation_status: string;
        moderation_notes: string | null;
      }
    | null;
};

function mapearNoticia(linha: LinhaNews): NewsItem {
  const nota = Number(linha.importance_score ?? 0);
  const analise = Array.isArray(linha.news_analysis)
    ? (linha.news_analysis[0] ?? null)
    : linha.news_analysis;
  const categoria = categoriaValida(linha.categories?.name);
  const resumo = analise?.summary ?? "";

  return {
    id: linha.id,
    titulo: linha.title,
    fonte: linha.sources?.name ?? "Cadastro manual",
    url: linha.source_url ?? "",
    horario: linha.published_at ?? linha.discovered_at,
    categoria,
    importancia: importanciaPorNota(nota),
    status: statusDoBanco[linha.status] ?? "nova",
    resumo,
    conteudo: linha.original_content ?? "",
    cidade: linha.city ?? "",
    estado: linha.state ?? "",
    importanciaNota: nota,
    confiancaIA: linha.ai_confidence,
    duplicada: linha.is_duplicate,
    ...(linha.duplicate_group_id ? { grupoDuplicidade: linha.duplicate_group_id } : {}),
    explicacaoIA: analise?.moderation_notes ?? "Análise ainda não registrada para esta notícia.",
    gerado: {
      titulo: analise?.instagram_title ?? linha.title,
      resumo,
      legenda: analise?.instagram_caption ?? "",
      hashtags: analise?.hashtags ?? "",
      textoArte: analise?.suggested_art_text ?? linha.title,
    },
    isDemo: linha.is_demo,
  };
}

export async function obterNoticias(projectId: string): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from("news")
    .select(SELECT_NEWS)
    .eq("project_id", projectId)
    .order("discovered_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as LinhaNews[]).map(mapearNoticia);
}

export async function obterNoticiaPorId(id: string): Promise<NewsItem | null> {
  const { data, error } = await supabase.from("news").select(SELECT_NEWS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapearNoticia(data as unknown as LinhaNews) : null;
}

export async function alterarStatusNoticia(id: string, status: NewsStatus) {
  const { error } = await supabase
    .from("news")
    .update({ status: statusParaBanco[status] })
    .eq("id", id);
  if (error) throw error;
}

export async function salvarAnaliseNoticia(
  newsId: string,
  valores: {
    summary?: string;
    instagram_title?: string;
    instagram_caption?: string;
    hashtags?: string;
    suggested_art_text?: string;
  },
) {
  const { error } = await supabase
    .from("news_analysis")
    .upsert({ news_id: newsId, ...valores }, { onConflict: "news_id" });
  if (error) throw error;
}

type LinhaPost = {
  id: string;
  news_id: string | null;
  title: string | null;
  caption: string | null;
  post_type: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  news: { title: string; categories: { name: string } | null } | null;
  analytics: { reach: number; likes: number; comments: number }[] | null;
};

export async function obterPublicacoes(projectId: string): Promise<Publication[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(
      `id, news_id, title, caption, post_type, status, scheduled_at, published_at, created_at,
       news ( title, categories ( name ) ),
       analytics ( reach, likes, comments )`,
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown as LinhaPost[]).map((p) => {
    const metrica = (p.analytics ?? [])[0];
    return {
      id: p.id,
      newsId: p.news_id ?? "",
      titulo: p.title ?? p.news?.title ?? "Publicação sem título",
      categoria: categoriaValida(p.news?.categories?.name),
      legenda: p.caption ?? "",
      status: statusPostDoBanco[p.status] ?? "rascunho",
      horario: p.published_at ?? p.scheduled_at ?? p.created_at,
      visualizacoes: metrica?.reach ?? 0,
      curtidas: metrica?.likes ?? 0,
      comentarios: metrica?.comments ?? 0,
      template: p.post_type,
    };
  });
}

export interface ResumoAnalytics {
  alcance: number;
  impressoes: number;
  curtidas: number;
  comentarios: number;
  compartilhamentos: number;
  salvamentos: number;
  diario: DailyMetric[];
}

export async function obterAnalytics(projectId: string): Promise<ResumoAnalytics> {
  const { data, error } = await supabase
    .from("analytics")
    .select("reach, impressions, likes, comments, shares, saves, collected_at, posts!inner(project_id)")
    .eq("posts.project_id", projectId)
    .order("collected_at");
  if (error) throw error;

  const linhas = (data ?? []) as unknown as {
    reach: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    collected_at: string;
  }[];

  const porDia = new Map<string, { publicacoes: number; alcance: number }>();
  linhas.forEach((l) => {
    const dia = new Date(l.collected_at).toISOString().slice(0, 10);
    const atual = porDia.get(dia) ?? { publicacoes: 0, alcance: 0 };
    porDia.set(dia, { publicacoes: atual.publicacoes + 1, alcance: atual.alcance + l.reach });
  });

  return {
    alcance: linhas.reduce((s, l) => s + l.reach, 0),
    impressoes: linhas.reduce((s, l) => s + l.impressions, 0),
    curtidas: linhas.reduce((s, l) => s + l.likes, 0),
    comentarios: linhas.reduce((s, l) => s + l.comments, 0),
    compartilhamentos: linhas.reduce((s, l) => s + l.shares, 0),
    salvamentos: linhas.reduce((s, l) => s + l.saves, 0),
    diario: [...porDia.entries()].map(([dia, v]) => ({ dia, ...v })),
  };
}
