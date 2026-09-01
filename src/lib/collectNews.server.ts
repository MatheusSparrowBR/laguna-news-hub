/**
 * Núcleo compartilhado da coleta de notícias (server-only).
 *
 * Usado por:
 *  - src/lib/collectNews.functions.ts  (coleta manual, cliente do usuário / RLS)
 *  - src/routes/api/public/hooks/collect-news.ts (coleta automática via cron, cliente admin)
 *
 * Não depende de Request HTTP, de usuário do navegador nem de TanStack.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type ClienteColeta = SupabaseClient<Database>;

export interface FeedItem {
  title: string;
  link: string;
  pubDate: string | null;
  description: string | null;
  imageUrl: string | null;
}

export interface CollectNewsSourceLog {
  source_id: string;
  source_name: string;
  rss_url?: string | null;
  found: number;
  new: number;
  duplicate: number;
  insert_errors: number;
  content_type: "xml" | "html" | "error" | null;
  error: string | null;
}

export interface CollectNewsResult {
  run_id: string | null;
  status: string;
  project_id: string;
  sources_checked: number;
  total_found: number;
  total_new: number;
  total_duplicate: number;
  total_insert_errors: number;
  total_errors: number;
  logs: CollectNewsSourceLog[];
}

/** Limites padrão da coleta. */
export const COLETA_TIMEOUT_MS = 10_000;
export const COLETA_MAX_RETRIES = 2;
export const COLETA_MAX_ITENS_POR_FONTE = 20;
/** Execuções "running" mais antigas que isso não bloqueiam uma nova coleta. */
export const COLETA_LOCK_MINUTOS = 15;

/* ------------------------------------------------------------------ parsing */

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function extractTag(block: string, tag: string): string | null {
  const cdata = block.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"),
  );
  if (cdata?.[1]) return cdata[1].trim();

  const plain = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return plain?.[1] ? plain[1].trim() : null;
}

function ehUrlDeImagem(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/** Extrai uma imagem do item do feed, apenas quando claramente disponível. */
function extrairImagem(block: string): string | null {
  const candidatos: Array<string | undefined> = [
    block.match(/<media:content[^>]*url=["']([^"']+)["']/i)?.[1],
    block.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i)?.[1],
    block.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*>/i)?.[1],
    block.match(/<img[^>]*src=["']([^"']+)["']/i)?.[1],
  ];

  for (const candidato of candidatos) {
    if (candidato && ehUrlDeImagem(candidato)) {
      return candidato
        .replace(/&amp;/g, "&")
        .trim()
        .substring(0, 1000);
    }
  }
  return null;
}

/** Extrai itens de feeds RSS 2.0 ou Atom. */
export function extractItems(xml: string): FeedItem[] {
  const items: FeedItem[] = [];

  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1] ?? "";
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    if (!title || !link) continue;
    const description = extractTag(block, "description") ?? extractTag(block, "content:encoded");
    items.push({
      title: decodeEntities(title),
      link: decodeEntities(link),
      pubDate: extractTag(block, "pubDate") ?? extractTag(block, "dc:date"),
      description: description ? decodeEntities(description) : null,
      imageUrl: extrairImagem(block),
    });
  }

  if (items.length === 0) {
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null) {
      const block = match[1] ?? "";
      const title = extractTag(block, "title");
      const hrefMatch = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/);
      const link = hrefMatch?.[1] ?? extractTag(block, "link");
      if (!title || !link) continue;
      const description = extractTag(block, "summary") ?? extractTag(block, "content");
      items.push({
        title: decodeEntities(title),
        link: decodeEntities(link),
        pubDate: extractTag(block, "published") ?? extractTag(block, "updated"),
        description: description ? decodeEntities(description) : null,
        imageUrl: extrairImagem(block),
      });
    }
  }

  return items;
}

/* -------------------------------------------------------------------- fetch */

export class ErroFonte extends Error {
  readonly contentType: "xml" | "html" | "error";
  constructor(message: string, contentType: "xml" | "html" | "error" = "error") {
    super(message);
    this.name = "ErroFonte";
    this.contentType = contentType;
  }
}

const STATUS_SEM_RETRY = new Set([400, 401, 403, 404]);

async function fetchComTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "NoticiasLaguna/1.0 (+https://laguna-news-hub.lovable.app)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export interface OpcoesFeed {
  timeoutMs?: number;
  maxRetries?: number;
  maxItens?: number;
}

/** Busca o feed de uma fonte, com timeout, retry controlado e validação básica. */
export async function buscarFeed(rssUrl: string, opcoes: OpcoesFeed = {}): Promise<FeedItem[]> {
  const timeoutMs = opcoes.timeoutMs ?? COLETA_TIMEOUT_MS;
  const maxRetries = opcoes.maxRetries ?? COLETA_MAX_RETRIES;
  const maxItens = opcoes.maxItens ?? COLETA_MAX_ITENS_POR_FONTE;

  let ultimoErro: ErroFonte = new ErroFonte("Falha desconhecida ao buscar o feed");

  for (let tentativa = 0; tentativa <= maxRetries; tentativa++) {
    if (tentativa > 0) {
      await new Promise((r) => setTimeout(r, 500 * tentativa));
    }

    let resposta: Response;
    try {
      resposta = await fetchComTimeout(rssUrl, timeoutMs);
    } catch (erro) {
      const abortado = erro instanceof Error && erro.name === "AbortError";
      ultimoErro = new ErroFonte(
        abortado ? `Timeout após ${timeoutMs}ms` : `Falha de rede: ${(erro as Error)?.message ?? "?"}`,
      );
      continue; // erro transitório → retry
    }

    if (!resposta.ok) {
      const erro = new ErroFonte(`HTTP ${resposta.status}`);
      if (STATUS_SEM_RETRY.has(resposta.status)) throw erro;
      ultimoErro = erro;
      continue;
    }

    const contentType = (resposta.headers.get("content-type") ?? "").toLowerCase();
    const corpo = (await resposta.text()).trim();

    if (!corpo) throw new ErroFonte("Resposta vazia do feed");

    const pareceHtml =
      contentType.includes("text/html") || /^<!doctype html/i.test(corpo) || /^<html[\s>]/i.test(corpo);
    if (pareceHtml && !corpo.includes("<rss") && !corpo.includes("<feed")) {
      throw new ErroFonte("A URL respondeu HTML, não um feed XML", "html");
    }

    const itens = extractItems(corpo);
    if (itens.length === 0 && !corpo.includes("<rss") && !corpo.includes("<feed")) {
      throw new ErroFonte("Conteúdo não reconhecido como RSS/Atom", "error");
    }

    return itens.slice(0, maxItens);
  }

  throw ultimoErro;
}

/** Converte a data do feed para ISO, com fallback para agora. */
export function dataParaIso(pubDate: string | null): string {
  if (pubDate) {
    const d = new Date(pubDate);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

/* --------------------------------------------------------------- núcleo run */

export interface OpcoesColeta {
  supabase: ClienteColeta;
  projectId: string;
  timeoutMs?: number;
  maxRetries?: number;
  maxItensPorFonte?: number;
  origem: "manual" | "cron";
}

function log(evento: string, dados: Record<string, unknown> = {}): void {
  console.log(`[collect-news] ${evento}`, JSON.stringify(dados));
}

/** Verifica se já existe uma coleta em andamento (lock simples baseado em automation_runs). */
export async function coletaEmAndamento(
  supabase: ClienteColeta,
  projectId: string,
): Promise<boolean> {
  const limite = new Date(Date.now() - COLETA_LOCK_MINUTOS * 60_000).toISOString();
  const { data } = await supabase
    .from("automation_runs")
    .select("id")
    .eq("project_id", projectId)
    .eq("run_type", "source_scan")
    .eq("status", "running")
    .gte("started_at", limite)
    .limit(1)
    .maybeSingle();
  return !!data;
}

/**
 * Executa a coleta de notícias das fontes ativas do projeto.
 * Retorna status "already_running" se houver outra coleta em andamento.
 */
export async function executarColeta(opcoes: OpcoesColeta): Promise<CollectNewsResult> {
  const { supabase, projectId, origem } = opcoes;
  const timeoutMs = opcoes.timeoutMs ?? COLETA_TIMEOUT_MS;
  const maxRetries = opcoes.maxRetries ?? COLETA_MAX_RETRIES;
  const maxItens = opcoes.maxItensPorFonte ?? COLETA_MAX_ITENS_POR_FONTE;

  const vazio: CollectNewsResult = {
    run_id: null,
    status: "already_running",
    project_id: projectId,
    sources_checked: 0,
    total_found: 0,
    total_new: 0,
    total_duplicate: 0,
    total_insert_errors: 0,
    total_errors: 0,
    logs: [],
  };

  if (await coletaEmAndamento(supabase, projectId)) {
    log("collection_skipped", { project_id: projectId, reason: "already_running", origem });
    return vazio;
  }

  log("collection_start", { project_id: projectId, origem });

  const { data: run, error: erroRun } = await supabase
    .from("automation_runs")
    .insert({
      project_id: projectId,
      run_type: "source_scan",
      status: "running",
      started_at: new Date().toISOString(),
      items_processed: 0,
    })
    .select("id")
    .single();

  if (erroRun || !run) {
    throw new Error(`Erro ao registrar execução: ${erroRun?.message ?? "desconhecido"}`);
  }

  const { data: fontes, error: erroFontes } = await supabase
    .from("sources")
    .select("id, name, rss_url")
    .eq("project_id", projectId)
    .eq("active", true)
    .not("rss_url", "is", null);

  if (erroFontes) {
    await supabase
      .from("automation_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: `Erro ao buscar fontes: ${erroFontes.message}`,
      })
      .eq("id", run.id);
    throw new Error(`Erro ao buscar fontes: ${erroFontes.message}`);
  }

  const ativas = (fontes ?? []).filter((f) => !!f.rss_url);
  const logs: CollectNewsSourceLog[] = [];
  let totalFound = 0;
  let totalNew = 0;
  let totalDuplicate = 0;
  let totalInsertErrors = 0;
  let totalErrors = 0;

  for (const fonte of ativas) {
    log("source_start", { source_id: fonte.id, name: fonte.name });
    try {
      const itens = await buscarFeed(fonte.rss_url as string, { timeoutMs, maxRetries, maxItens });

      let novas = 0;
      let duplicadas = 0;
      let errosInsert = 0;

      for (const item of itens) {
        const { data: existente } = await supabase
          .from("news")
          .select("id")
          .eq("project_id", projectId)
          .eq("source_url", item.link)
          .limit(1)
          .maybeSingle();

        if (existente) {
          duplicadas++;
          continue;
        }

        const { error: erroInsert } = await supabase.from("news").insert({
          project_id: projectId,
          source_id: fonte.id,
          title: item.title.substring(0, 500),
          original_content: item.description ?? "",
          source_url: item.link,
          image_url: item.imageUrl,
          discovered_at: dataParaIso(item.pubDate),
          status: "new",
          importance_score: 5,
          ai_confidence: 0,
          is_duplicate: false,
          is_demo: false,
        });

        if (erroInsert) {
          errosInsert++;
          log("insert_error", { source_id: fonte.id, motivo: erroInsert.message });
        } else {
          novas++;
        }
      }

      totalFound += itens.length;
      totalNew += novas;
      totalDuplicate += duplicadas;
      totalInsertErrors += errosInsert;

      await supabase
        .from("sources")
        .update({ last_checked_at: new Date().toISOString() })
        .eq("id", fonte.id);

      logs.push({
        source_id: fonte.id,
        source_name: fonte.name,
        rss_url: fonte.rss_url,
        found: itens.length,
        new: novas,
        duplicate: duplicadas,
        insert_errors: errosInsert,
        content_type: "xml",
        error: errosInsert > 0 ? `${errosInsert} item(ns) com erro de gravação` : null,
      });

      log("source_success", {
        source_id: fonte.id,
        found: itens.length,
        new: novas,
        duplicate: duplicadas,
        insert_errors: errosInsert,
      });
    } catch (erro) {
      totalErrors++;
      const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido";
      const contentType = erro instanceof ErroFonte ? erro.contentType : "error";
      logs.push({
        source_id: fonte.id,
        source_name: fonte.name,
        rss_url: fonte.rss_url,
        found: 0,
        new: 0,
        duplicate: 0,
        insert_errors: 0,
        content_type: contentType,
        error: mensagem,
      });
      log("source_error", { source_id: fonte.id, status: contentType, erro: mensagem });
    }
  }

  const status =
    totalErrors > 0 && totalNew === 0 && totalDuplicate === 0
      ? "failed"
      : totalErrors > 0 || totalInsertErrors > 0
        ? "partial"
        : "completed";

  const resumo = [
    `fontes=${ativas.length}`,
    `encontradas=${totalFound}`,
    `novas=${totalNew}`,
    `duplicadas=${totalDuplicate}`,
    `erros_insert=${totalInsertErrors}`,
    `fontes_com_erro=${totalErrors}`,
    `origem=${origem}`,
  ].join(" ");

  const detalhesErro = logs
    .filter((l) => l.error)
    .map((l) => `${l.source_name}: ${l.error}`)
    .join(" | ");

  await supabase
    .from("automation_runs")
    .update({
      status: status as "completed" | "failed" | "partial",
      completed_at: new Date().toISOString(),
      items_processed: totalNew,
      error_message: detalhesErro ? `${resumo} :: ${detalhesErro}`.substring(0, 2000) : resumo,
    })
    .eq("id", run.id);

  log("collection_complete", { project_id: projectId, run_id: run.id, status, resumo });

  return {
    run_id: run.id,
    status,
    project_id: projectId,
    sources_checked: ativas.length,
    total_found: totalFound,
    total_new: totalNew,
    total_duplicate: totalDuplicate,
    total_insert_errors: totalInsertErrors,
    total_errors: totalErrors,
    logs,
  };
}
