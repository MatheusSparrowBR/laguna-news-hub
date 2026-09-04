import { supabase } from "@/integrations/supabase/client";

/**
 * Acesso ao banco das novas áreas: editorial, geografia, posts,
 * patrocinadores, campanhas, entregas, avisos e métricas internas.
 *
 * Somente dados reais. Nada é inventado: quando não há registro, a tela
 * mostra vazio em vez de número fictício.
 */

export type DecisaoGeo = "local" | "outside" | "uncertain";

export interface GeoRegistro {
  id: string;
  news_id: string;
  decision: DecisaoGeo;
  score: number;
  matched_localities: string[];
  matched_entities: string[];
  excluded_localities: string[];
  reason: string;
  source_mode: string;
  review_status: string;
  manual_decision: DecisaoGeo | null;
  review_notes: string | null;
  reviewed_at: string | null;
}

export interface NoticiaEditorial {
  id: string;
  title: string;
  status: string;
  importance_score: number;
  source_url: string | null;
  image_url: string | null;
  original_content: string | null;
  discovered_at: string;
  category_name: string | null;
  source_name: string | null;
  geo: GeoRegistro | null;
}

type Relacao = { name: string | null } | { name: string | null }[] | null;

function nomeRelacao(valor: Relacao): string | null {
  if (!valor) return null;
  const alvo = Array.isArray(valor) ? valor[0] : valor;
  return alvo?.name ?? null;
}

/** Fila editorial: notícias com a análise geográfica quando existir. */
export async function obterFilaEditorial(projectId: string): Promise<NoticiaEditorial[]> {
  const { data, error } = await supabase
    .from("news")
    .select(
      "id, title, status, importance_score, source_url, image_url, original_content, discovered_at, categories(name), sources(name), news_geography(id, news_id, decision, score, matched_localities, matched_entities, excluded_localities, reason, source_mode, review_status, manual_decision, review_notes, reviewed_at)",
    )
    .eq("project_id", projectId)
    .order("discovered_at", { ascending: false })
    .limit(300);

  if (error) throw new Error(error.message);

  return (data ?? []).map((linha) => {
    const geoBruto = linha.news_geography as unknown;
    const geo = (Array.isArray(geoBruto) ? geoBruto[0] : geoBruto) as GeoRegistro | null;
    return {
      id: linha.id,
      title: linha.title,
      status: linha.status,
      importance_score: Number(linha.importance_score ?? 0),
      source_url: linha.source_url,
      image_url: linha.image_url,
      original_content: linha.original_content,
      discovered_at: linha.discovered_at,
      category_name: nomeRelacao(linha.categories as Relacao),
      source_name: nomeRelacao(linha.sources as Relacao),
      geo: geo ?? null,
    };
  });
}

/* ------------------------------------------------------------------ posts */

export interface PostRegistro {
  id: string;
  project_id: string;
  news_id: string | null;
  campaign_id: string | null;
  sponsor_id: string | null;
  is_sponsored: boolean;
  post_type: string;
  title: string | null;
  caption: string | null;
  hashtags: string | null;
  image_url: string | null;
  template_key: string | null;
  channel: string | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
}

const CAMPOS_POST =
  "id, project_id, news_id, campaign_id, sponsor_id, is_sponsored, post_type, title, caption, hashtags, image_url, template_key, channel, status, scheduled_at, published_at, created_at";

export async function obterPosts(projectId: string): Promise<PostRegistro[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(CAMPOS_POST)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  return (data ?? []) as PostRegistro[];
}

export interface EntradaPost {
  project_id: string;
  news_id?: string | null;
  campaign_id?: string | null;
  sponsor_id?: string | null;
  is_sponsored: boolean;
  post_type: "feed" | "story" | "reel";
  title: string;
  caption: string;
  hashtags: string;
  image_url?: string | null;
  template_key?: string | null;
  channel?: string;
  status: string;
  scheduled_at?: string | null;
}

/** Idempotente por chave: recriar o mesmo post não gera duplicado. */
export async function salvarPost(entrada: EntradaPost & { id?: string }): Promise<PostRegistro> {
  const { id, ...campos } = entrada;
  const chave = `${campos.project_id}:${campos.news_id ?? campos.campaign_id ?? "manual"}:${campos.post_type}`;

  if (id) {
    const { data, error } = await supabase
      .from("posts")
      .update(campos as never)
      .eq("id", id)
      .select(CAMPOS_POST)
      .single();
    if (error) throw new Error(error.message);
    return data as PostRegistro;
  }

  const { data, error } = await supabase
    .from("posts")
    .upsert({ ...campos, idempotency_key: chave } as never, { onConflict: "idempotency_key" })
    .select(CAMPOS_POST)
    .single();
  if (error) throw new Error(error.message);
  return data as PostRegistro;
}

export async function alterarStatusPost(
  id: string,
  status: string,
  scheduledAt?: string | null,
): Promise<void> {
  const campos: Record<string, unknown> = { status };
  if (scheduledAt !== undefined) campos["scheduled_at"] = scheduledAt;
  const { error } = await supabase.from("posts").update(campos as never).eq("id", id);
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------- patrocinadores */

export interface Sponsor {
  id: string;
  project_id: string;
  name: string;
  display_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  instagram_handle: string | null;
  website: string | null;
  logo_url: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
}

const CAMPOS_SPONSOR =
  "id, project_id, name, display_name, contact_name, email, phone, instagram_handle, website, logo_url, notes, active, created_at";

export async function obterPatrocinadores(projectId: string): Promise<Sponsor[]> {
  const { data, error } = await supabase
    .from("sponsors")
    .select(CAMPOS_SPONSOR)
    .eq("project_id", projectId)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Sponsor[];
}

export async function salvarPatrocinador(
  entrada: Partial<Sponsor> & { project_id: string; name: string },
): Promise<Sponsor> {
  if (entrada.id) {
    const { id, ...campos } = entrada;
    const { data, error } = await supabase
      .from("sponsors")
      .update(campos as never)
      .eq("id", id)
      .select(CAMPOS_SPONSOR)
      .single();
    if (error) throw new Error(error.message);
    return data as Sponsor;
  }
  const { data, error } = await supabase
    .from("sponsors")
    .insert(entrada as never)
    .select(CAMPOS_SPONSOR)
    .single();
  if (error) throw new Error(error.message);
  return data as Sponsor;
}

export interface Campanha {
  id: string;
  project_id: string;
  sponsor_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  contracted_posts: number;
  delivered_posts: number;
  status: string;
  notes: string | null;
  created_at: string;
  sponsor_name?: string | null;
}

const CAMPOS_CAMPANHA =
  "id, project_id, sponsor_id, name, description, start_date, end_date, budget, contracted_posts, delivered_posts, status, notes, created_at, sponsors(name)";

export async function obterCampanhas(projectId: string): Promise<Campanha[]> {
  const { data, error } = await supabase
    .from("sponsor_campaigns")
    .select(CAMPOS_CAMPANHA)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((linha) => ({
    ...(linha as unknown as Campanha),
    budget: linha.budget === null ? null : Number(linha.budget),
    sponsor_name: nomeRelacao(linha.sponsors as Relacao),
  }));
}

export async function salvarCampanha(
  entrada: Partial<Campanha> & { project_id: string; sponsor_id: string; name: string },
): Promise<void> {
  const { id, sponsor_name: _sponsorName, ...campos } = entrada;
  if (id) {
    const { error } = await supabase
      .from("sponsor_campaigns")
      .update(campos as never)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabase.from("sponsor_campaigns").insert(campos as never);
  if (error) throw new Error(error.message);
}

export interface Entrega {
  id: string;
  campaign_id: string;
  post_id: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  campaign_name?: string | null;
}

export async function obterEntregas(projectId: string): Promise<Entrega[]> {
  const { data, error } = await supabase
    .from("sponsor_deliverables")
    .select(
      "id, campaign_id, post_id, scheduled_at, published_at, status, notes, created_at, sponsor_campaigns!inner(name, project_id)",
    )
    .eq("sponsor_campaigns.project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((linha) => ({
    ...(linha as unknown as Entrega),
    campaign_name: nomeRelacao(linha.sponsor_campaigns as Relacao),
  }));
}

export async function salvarEntrega(entrada: {
  id?: string;
  campaign_id: string;
  post_id?: string | null;
  scheduled_at?: string | null;
  status: string;
  notes?: string | null;
}): Promise<void> {
  const { id, ...campos } = entrada;
  if (id) {
    const { error } = await supabase
      .from("sponsor_deliverables")
      .update(campos as never)
      .eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabase.from("sponsor_deliverables").insert(campos as never);
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------- avisos */

export interface Aviso {
  id: string;
  kind: string;
  title: string;
  message: string | null;
  news_id: string | null;
  post_id: string | null;
  campaign_id: string | null;
  read_at: string | null;
  created_at: string;
}

export async function obterAvisos(projectId: string): Promise<Aviso[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, title, message, news_id, post_id, campaign_id, read_at, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as Aviso[];
}

export async function marcarAvisoLido(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------- publicação (fila/logs) */

export interface LogPublicacao {
  id: string;
  post_id: string;
  provider: string;
  external_id: string | null;
  status: string;
  attempt: number;
  attempted_at: string;
  published_at: string | null;
  error_code: string | null;
  error_message: string | null;
}

export async function obterLogsPublicacao(projectId: string): Promise<LogPublicacao[]> {
  const { data, error } = await supabase
    .from("publication_logs")
    .select(
      "id, post_id, provider, external_id, status, attempt, attempted_at, published_at, error_code, error_message, posts!inner(project_id)",
    )
    .eq("posts.project_id", projectId)
    .order("attempted_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as LogPublicacao[];
}

/* --------------------------------------------------- métricas internas */

export interface MetricasInternas {
  noticias_total: number;
  noticias_hoje: number;
  geo_local: number;
  geo_outside: number;
  geo_uncertain: number;
  geo_sem_analise: number;
  alta_importancia: number;
  aguardando_aprovacao: number;
  aprovadas: number;
  rejeitadas: number;
  posts_total: number;
  posts_rascunho: number;
  posts_agendados: number;
  posts_publicados: number;
  posts_falhos: number;
  posts_patrocinados: number;
  campanhas_ativas: number;
  entregas_pendentes: number;
}

export async function obterMetricasInternas(projectId: string): Promise<MetricasInternas> {
  const [noticias, posts, campanhas, entregas] = await Promise.all([
    obterFilaEditorial(projectId),
    obterPosts(projectId),
    obterCampanhas(projectId),
    obterEntregas(projectId),
  ]);

  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);

  const decisao = (n: NoticiaEditorial): DecisaoGeo | null =>
    n.geo ? (n.geo.manual_decision ?? n.geo.decision) : null;

  return {
    noticias_total: noticias.length,
    noticias_hoje: noticias.filter((n) => new Date(n.discovered_at) >= inicioHoje).length,
    geo_local: noticias.filter((n) => decisao(n) === "local").length,
    geo_outside: noticias.filter((n) => decisao(n) === "outside").length,
    geo_uncertain: noticias.filter((n) => decisao(n) === "uncertain").length,
    geo_sem_analise: noticias.filter((n) => !n.geo).length,
    alta_importancia: noticias.filter((n) => n.importance_score >= 8).length,
    aguardando_aprovacao: noticias.filter(
      (n) => n.status === "awaiting_approval" || n.status === "review_required",
    ).length,
    aprovadas: noticias.filter((n) => n.status === "approved").length,
    rejeitadas: noticias.filter((n) => n.status === "rejected").length,
    posts_total: posts.length,
    posts_rascunho: posts.filter((p) => p.status === "draft").length,
    posts_agendados: posts.filter((p) => p.status === "scheduled").length,
    posts_publicados: posts.filter((p) => p.status === "published").length,
    posts_falhos: posts.filter((p) => p.status === "failed").length,
    posts_patrocinados: posts.filter((p) => p.is_sponsored).length,
    campanhas_ativas: campanhas.filter((c) => c.status === "active").length,
    entregas_pendentes: entregas.filter(
      (e) => e.status === "contracted" || e.status === "scheduled",
    ).length,
  };
}
