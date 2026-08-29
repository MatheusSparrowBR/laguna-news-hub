/**
 * Helpers server-only para a coleta de notícias via RSS.
 * Sem dependências de navegador — usado apenas dentro de server functions.
 */

export interface FeedItem {
  title: string;
  link: string;
  pubDate: string | null;
  description: string | null;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
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
    const description = extractTag(block, "description");
    items.push({
      title: decodeEntities(title),
      link: decodeEntities(link),
      pubDate: extractTag(block, "pubDate") ?? extractTag(block, "dc:date"),
      description: description ? decodeEntities(description) : null,
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
      });
    }
  }

  return items;
}

/** Busca o feed de uma fonte e devolve os itens encontrados. */
export async function buscarFeed(rssUrl: string): Promise<FeedItem[]> {
  const resposta = await fetch(rssUrl, {
    headers: { "User-Agent": "NoticiasLaguna/1.0 (+https://laguna-news-hub.lovable.app)" },
  });
  if (!resposta.ok) {
    throw new Error(`HTTP ${resposta.status}`);
  }
  const xml = await resposta.text();
  return extractItems(xml);
}

/** Converte a data do feed para ISO, com fallback para agora. */
export function dataParaIso(pubDate: string | null): string {
  if (pubDate) {
    const d = new Date(pubDate);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}
