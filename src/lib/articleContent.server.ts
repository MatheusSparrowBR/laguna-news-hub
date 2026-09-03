/**
 * Busca e extração do CONTEÚDO COMPLETO de uma matéria (server-only).
 *
 * Motivo: o RSS da maioria das fontes traz somente um lead curto (47–107
 * caracteres na Sul Notícias), insuficiente para o filtro geográfico decidir
 * onde o fato aconteceu. O corpo completo da página traz cidade e bairro.
 *
 * Escopo deste módulo (invariantes):
 *  - NÃO acessa banco de dados.
 *  - NÃO acessa secrets, cookies, tokens ou Authorization.
 *  - NÃO usa IA.
 *  - NUNCA lança exceção: toda falha volta como { success: false } para que a
 *    coleta siga com o lead do RSS (fallback).
 */

/* ------------------------------------------------------------ configuração */

/** Extractor específico por domínio (centralizado, sem exceções espalhadas). */
export interface ExtractorFonte {
  /** Sufixo de host, ex.: "sulagora.com.br". */
  dominio: string;
  /** Classe do container onde o corpo da matéria começa. */
  containerClasse: string;
  /** Classe onde o corpo termina (início da barra lateral / "mais lidas"). */
  corteClasse?: string;
}

export const EXTRACTORS_POR_FONTE: readonly ExtractorFonte[] = [
  // Auditoria em sulagora.com.br: corpo em div.noticiadetalhes, corte em div.col2.
  { dominio: "sulagora.com.br", containerClasse: "noticiadetalhes", corteClasse: "col2" },
];

/** Tamanho mínimo para considerar o corpo extraído confiável. */
export const MIN_CARACTERES_CORPO = 200;
/** Timeout máximo por página. */
export const FETCH_CONTEUDO_TIMEOUT_MS = 5_000;
/** Tentativa inicial + no máximo 1 retry. */
export const FETCH_CONTEUDO_MAX_RETRIES = 1;
/** Concorrência máxima de páginas simultâneas. */
export const FETCH_CONTEUDO_CONCORRENCIA = 4;
/** Intervalo curto entre lotes, para não bombardear a fonte. */
export const FETCH_CONTEUDO_INTERVALO_LOTE_MS = 150;

const STATUS_SEM_RETRY = new Set([400, 401, 403, 404, 429]);

export type OrigemConteudo =
  | "fonte-especifica"
  | "article"
  | "main"
  | "meta-description"
  | "rss";

export interface ResultadoConteudo {
  success: boolean;
  content: string | null;
  title?: string;
  /** De onde o corpo veio, quando houve sucesso. */
  via?: OrigemConteudo;
  /** Motivo da falha, quando success === false. */
  reason?: string;
}

/* -------------------------------------------------------- HTML → texto puro */

const ENTIDADES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  aacute: "á",
  agrave: "à",
  atilde: "ã",
  acirc: "â",
  eacute: "é",
  ecirc: "ê",
  iacute: "í",
  oacute: "ó",
  otilde: "õ",
  ocirc: "ô",
  uacute: "ú",
  ccedil: "ç",
};

export function decodificarEntidades(texto: string): string {
  return texto
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (todo, nome: string) => ENTIDADES[nome.toLowerCase()] ?? todo);
}

/** Remove blocos que nunca contêm o corpo da matéria. */
export function removerBlocosIrrelevantes(html: string): string {
  let saida = html;
  for (const tag of ["script", "style", "nav", "footer", "aside", "form", "noscript", "iframe"]) {
    saida = saida.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, "gi"), " ");
  }
  return saida.replace(/<!--[\s\S]*?-->/g, " ");
}

const MARCADORES_RUIDO = [
  /continua\s+depois\s+da\s+publicidade/gi,
  /publicidade/gi,
  /compartilhe(\s+essa\s+not[íi]cia)?/gi,
  /leia\s+tamb[ée]m/gi,
];

/** Converte um fragmento HTML em texto legível, preservando parágrafos. */
export function htmlParaTexto(fragmento: string): string {
  let texto = removerBlocosIrrelevantes(fragmento)
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*(p|div|h[1-6]|li|tr|section|article)\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ");

  texto = decodificarEntidades(texto);
  for (const ruido of MARCADORES_RUIDO) texto = texto.replace(ruido, " ");

  return texto
    .replace(/\u00a0/g, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ------------------------------------------------------------ localizadores */

function indiceDivPorClasse(html: string, classe: string, desde = 0): number {
  const re = new RegExp(`<(div|section|article)\\b[^>]*class=["'][^"']*\\b${classe}\\b`, "i");
  const trecho = html.slice(desde);
  const m = re.exec(trecho);
  return m?.index === undefined ? -1 : desde + m.index;
}

function conteudoDaTag(html: string, tag: "article" | "main"): string | null {
  const m = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(html);
  return m?.[1] ?? null;
}

function metaDescription(html: string): string | null {
  const padroes = [
    /<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']*)["']/i,
    /<meta[^>]+content=["']([^"']*)["'][^>]*property=["']og:description["']/i,
    /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i,
  ];
  for (const p of padroes) {
    const m = p.exec(html);
    if (m?.[1]) return decodificarEntidades(m[1]).trim();
  }
  return null;
}

export function extrairTitulo(html: string): string | undefined {
  const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1];
  const titulo = htmlParaTexto(h1 ?? "");
  if (titulo) return titulo;
  const tag = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  const alternativo = htmlParaTexto(tag ?? "");
  return alternativo || undefined;
}

function extractorDaUrl(url: string): ExtractorFonte | undefined {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
  return EXTRACTORS_POR_FONTE.find((e) => host === e.dominio || host.endsWith(`.${e.dominio}`));
}

/**
 * Extrai o corpo da matéria de um HTML, em cascata:
 *  1. seletor específico da fonte  2. <article>  3. <main>
 *  4. meta description (último recurso)
 * Não lança: devolve success:false quando nada confiável é encontrado.
 */
export function extrairCorpoDeHtml(html: string, url: string): ResultadoConteudo {
  if (!html || !/<[a-z!]/i.test(html)) {
    return { success: false, content: null, reason: "html-invalido" };
  }

  const title = extrairTitulo(html);
  const limpo = removerBlocosIrrelevantes(html);

  const extractor = extractorDaUrl(url);
  if (extractor) {
    const inicio = indiceDivPorClasse(limpo, extractor.containerClasse);
    if (inicio >= 0) {
      const corte = extractor.corteClasse
        ? indiceDivPorClasse(limpo, extractor.corteClasse, inicio + 1)
        : -1;
      const fragmento = limpo.slice(inicio, corte > inicio ? corte : undefined);
      const texto = htmlParaTexto(fragmento);
      if (texto.length >= MIN_CARACTERES_CORPO) {
        return { success: true, content: texto, title, via: "fonte-especifica" };
      }
    }
  }

  for (const tag of ["article", "main"] as const) {
    const fragmento = conteudoDaTag(limpo, tag);
    if (!fragmento) continue;
    const texto = htmlParaTexto(fragmento);
    if (texto.length >= MIN_CARACTERES_CORPO) {
      return { success: true, content: texto, title, via: tag };
    }
  }

  const meta = metaDescription(html);
  if (meta && meta.length >= 80) {
    return { success: true, content: meta, title, via: "meta-description" };
  }

  return { success: false, content: null, title, reason: "corpo-nao-encontrado" };
}

/* -------------------------------------------------------------------- fetch */

export interface OpcoesConteudo {
  timeoutMs?: number;
  maxRetries?: number;
  /** Injetável nos testes; padrão: fetch global. */
  fetchImpl?: typeof fetch;
}

async function fetchPagina(
  url: string,
  timeoutMs: number,
  fetchImpl: typeof fetch,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "NoticiasLaguna/1.0 (+https://laguna-news-hub.lovable.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Busca a página da matéria e devolve o corpo completo em texto.
 * Nunca lança: falhas voltam como { success: false, reason }.
 */
export async function buscarConteudoCompleto(
  sourceUrl: string,
  opcoes: OpcoesConteudo = {},
): Promise<ResultadoConteudo> {
  const timeoutMs = opcoes.timeoutMs ?? FETCH_CONTEUDO_TIMEOUT_MS;
  const maxRetries = opcoes.maxRetries ?? FETCH_CONTEUDO_MAX_RETRIES;
  const fetchImpl = opcoes.fetchImpl ?? fetch;

  if (!/^https?:\/\//i.test(sourceUrl)) {
    return { success: false, content: null, reason: "url-invalida" };
  }

  let motivo = "falha-desconhecida";

  for (let tentativa = 0; tentativa <= maxRetries; tentativa += 1) {
    if (tentativa > 0) await new Promise((r) => setTimeout(r, 300));

    let resposta: Response;
    try {
      resposta = await fetchPagina(sourceUrl, timeoutMs, fetchImpl);
    } catch (erro) {
      const abortado = erro instanceof Error && erro.name === "AbortError";
      motivo = abortado ? `timeout-${timeoutMs}ms` : `rede: ${(erro as Error)?.message ?? "?"}`;
      continue; // transitório → retry
    }

    if (!resposta.ok) {
      motivo = `http-${resposta.status}`;
      if (STATUS_SEM_RETRY.has(resposta.status)) break;
      continue; // 5xx e demais → retry
    }

    const contentType = (resposta.headers.get("content-type") ?? "").toLowerCase();
    let corpo = "";
    try {
      corpo = await resposta.text();
    } catch {
      motivo = "corpo-ilegivel";
      continue;
    }

    if (!corpo.trim()) {
      motivo = "pagina-vazia";
      break;
    }

    const pareceHtml =
      contentType.includes("html") || contentType === "" || /<[a-z!]/i.test(corpo);
    if (!pareceHtml) {
      motivo = `content-type-${contentType || "desconhecido"}`;
      break;
    }

    return extrairCorpoDeHtml(corpo, sourceUrl);
  }

  return { success: false, content: null, reason: motivo };
}

/** Executa `tarefa` sobre `itens` com concorrência limitada e pausa entre lotes. */
export async function mapearComLimite<T, R>(
  itens: readonly T[],
  limite: number,
  tarefa: (item: T) => Promise<R>,
  intervaloLoteMs = FETCH_CONTEUDO_INTERVALO_LOTE_MS,
): Promise<R[]> {
  const tamanho = Math.max(1, limite);
  const resultados: R[] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    const lote = itens.slice(i, i + tamanho);
    resultados.push(...(await Promise.all(lote.map(tarefa))));
    if (i + tamanho < itens.length && intervaloLoteMs > 0) {
      await new Promise((r) => setTimeout(r, intervaloLoteMs));
    }
  }
  return resultados;
}
