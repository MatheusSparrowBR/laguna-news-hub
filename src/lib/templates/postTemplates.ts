/**
 * Geração determinística de título, legenda e hashtags de POSTAGEM.
 *
 * SEM IA. Puro, sem rede, sem banco, sem secrets.
 *
 * Regra fundamental (FASE 48): nunca substitui a notícia original.
 *   news.title / news.original_content  → conteúdo jornalístico (intocado)
 *   post.title / post.caption / post.hashtags → derivados, editáveis
 */

import { NOME_DO_PERFIL, APP_NAME } from "@/config/app";

/** Slugs de categoria usados pelo motor de classificação. */
export type TemplateKey =
  | "urgente"
  | "transito"
  | "seguranca"
  | "clima"
  | "prefeitura"
  | "cidade"
  | "eventos"
  | "turismo"
  | "esportes"
  | "saude"
  | "educacao"
  | "economia"
  | "patrocinado";

export const TEMPLATE_KEYS: readonly TemplateKey[] = [
  "urgente",
  "transito",
  "seguranca",
  "clima",
  "prefeitura",
  "cidade",
  "eventos",
  "turismo",
  "esportes",
  "saude",
  "educacao",
  "economia",
  "patrocinado",
] as const;

const PREFIXOS: Record<TemplateKey, string> = {
  urgente: "🚨 URGENTE",
  transito: "🚧 TRÂNSITO",
  seguranca: "🚔 SEGURANÇA",
  clima: "🌧️ CLIMA",
  prefeitura: "🏛️ PREFEITURA",
  cidade: "📍 LAGUNA",
  eventos: "🎉 EVENTOS",
  turismo: "🏖️ TURISMO",
  esportes: "🏆 ESPORTES",
  saude: "🏥 SAÚDE",
  educacao: "🎓 EDUCAÇÃO",
  economia: "💼 ECONOMIA",
  patrocinado: "📣 PUBLICIDADE",
};

const ROTULOS: Record<TemplateKey, string> = {
  urgente: "Urgente",
  transito: "Trânsito",
  seguranca: "Segurança",
  clima: "Clima",
  prefeitura: "Prefeitura",
  cidade: "Cidade",
  eventos: "Eventos",
  turismo: "Turismo",
  esportes: "Esportes",
  saude: "Saúde",
  educacao: "Educação",
  economia: "Economia",
  patrocinado: "Patrocinado",
};

export function rotuloTemplate(key: TemplateKey): string {
  return ROTULOS[key];
}

export function prefixoTemplate(key: TemplateKey): string {
  return PREFIXOS[key];
}

/** Converte o slug da categoria (banco) em template; urgente vem do score. */
export function templateParaNoticia(
  categoriaSlug: string | null | undefined,
  importanceScore = 0,
): TemplateKey {
  if (importanceScore >= 9) return "urgente";
  const slug = (categoriaSlug ?? "").toLowerCase();
  const encontrado = TEMPLATE_KEYS.find((k) => k === slug);
  if (encontrado && encontrado !== "patrocinado") return encontrado;
  return "cidade";
}

/* --------------------------------------------------------- texto utilitário */

/** Remove HTML, entidades comuns e espaços redundantes. */
export function limparTexto(texto: string): string {
  return texto
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** Corta no limite sem cortar palavra ao meio; acrescenta reticências. */
export function cortarEmPalavra(texto: string, limite: number): string {
  const limpo = limparTexto(texto);
  if (limite <= 0) return "";
  if (limpo.length <= limite) return limpo;
  const fatia = limpo.slice(0, limite);
  const ultimoEspaco = fatia.lastIndexOf(" ");
  const base = ultimoEspaco > limite * 0.5 ? fatia.slice(0, ultimoEspaco) : fatia;
  return `${base.replace(/[\s,;:.-]+$/, "")}…`;
}

/** Primeiras frases completas até o limite (usado no resumo da legenda). */
export function primeirasFrases(texto: string, limite = 320): string {
  const limpo = limparTexto(texto);
  if (!limpo) return "";
  const frases = limpo.split(/(?<=[.!?])\s+/);
  let saida = "";
  for (const frase of frases) {
    if (!saida) {
      saida = frase;
    } else if (`${saida} ${frase}`.length <= limite) {
      saida = `${saida} ${frase}`;
    } else {
      break;
    }
  }
  return saida.length > limite ? cortarEmPalavra(saida, limite) : saida;
}

/* -------------------------------------------------- FASE 9 — título do post */

export const TITULO_POST_MAX = 90;

export interface EntradaTituloPost {
  newsTitle: string;
  template: TemplateKey;
  /** Nome do patrocinador — obrigatório no template patrocinado. */
  sponsorName?: string | null;
}

/** Título de POSTAGEM determinístico. Nunca altera news.title. */
export function gerarTituloPost(entrada: EntradaTituloPost): string {
  const base = limparTexto(entrada.newsTitle);
  if (entrada.template === "patrocinado") {
    const nome = limparTexto(entrada.sponsorName ?? "");
    const corpo = base || nome;
    return cortarEmPalavra(
      `${PREFIXOS.patrocinado}${nome && base ? ` • ${nome}` : ""}: ${corpo}`,
      TITULO_POST_MAX,
    );
  }
  if (!base) return PREFIXOS[entrada.template];
  return cortarEmPalavra(`${PREFIXOS[entrada.template]}: ${base}`, TITULO_POST_MAX);
}

/* ------------------------------------------------- FASE 11 — hashtags */

const HASHTAGS_BASE = ["#Laguna", "#LagunaSC", "#SantaCatarina", "#NoticiasLaguna"] as const;

const HASHTAGS_CATEGORIA: Record<TemplateKey, readonly string[]> = {
  urgente: ["#Urgente", "#PlantaoLaguna"],
  transito: ["#Transito", "#BR101"],
  seguranca: ["#Seguranca", "#Policia"],
  clima: ["#Chuva", "#DefesaCivil"],
  prefeitura: ["#PrefeituraDeLaguna", "#ServicoPublico"],
  cidade: ["#CidadeDeLaguna"],
  eventos: ["#EventosLaguna", "#AgendaCultural"],
  turismo: ["#TurismoLaguna", "#PraiaDoMar"],
  esportes: ["#EsporteLaguna"],
  saude: ["#Saude", "#SaudePublica"],
  educacao: ["#Educacao", "#EscolaPublica"],
  economia: ["#Economia", "#Emprego"],
  patrocinado: ["#Publicidade", "#ApoieOLocal"],
};

export const HASHTAGS_MAX = 8;

/** Gerador determinístico de hashtags, sem excesso e sem repetição. */
export function gerarHashtags(template: TemplateKey, extras: readonly string[] = []): string[] {
  const normalizar = (tag: string): string => {
    const limpa = tag.trim().replace(/^#+/, "").replace(/[^\p{L}\p{N}]/gu, "");
    return limpa ? `#${limpa}` : "";
  };
  const lista: string[] = [];
  const vistas = new Set<string>();
  for (const tag of [...HASHTAGS_BASE, ...HASHTAGS_CATEGORIA[template], ...extras]) {
    const normal = normalizar(tag);
    if (!normal) continue;
    const chave = normal.toLowerCase();
    if (vistas.has(chave)) continue;
    vistas.add(chave);
    lista.push(normal);
    if (lista.length >= HASHTAGS_MAX) break;
  }
  return lista;
}

export function hashtagsComoTexto(tags: readonly string[]): string {
  return tags.join(" ");
}

/* ------------------------------------------------ FASE 10 — legenda do post */

export interface EntradaLegendaPost {
  newsTitle: string;
  /** Conteúdo original (RSS lead ou conteúdo completo). Nunca é alterado. */
  content?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  template: TemplateKey;
  sponsorName?: string | null;
  /** Chamada final personalizada (patrocinado costuma ter CTA próprio). */
  cta?: string | null;
  hashtags?: readonly string[];
}

export interface LegendaPost {
  gancho: string;
  resumo: string;
  fonte: string;
  cta: string;
  hashtags: string[];
  texto: string;
}

const CTA_PADRAO = `Acompanhe o ${APP_NAME.replace("Projeto ", "")} ${NOME_DO_PERFIL} para mais informações.`;

/** Legenda determinística: gancho, resumo, fonte, CTA e hashtags. */
export function gerarLegendaPost(entrada: EntradaLegendaPost): LegendaPost {
  const patrocinado = entrada.template === "patrocinado";
  const gancho = gerarTituloPost({
    newsTitle: entrada.newsTitle,
    template: entrada.template,
    sponsorName: entrada.sponsorName ?? null,
  });
  const resumo = primeirasFrases(entrada.content ?? "", 320);
  const nomeFonte = limparTexto(entrada.sourceName ?? "");
  const fonte = patrocinado
    ? limparTexto(entrada.sponsorName ?? "")
      ? `📣 Publicidade: ${limparTexto(entrada.sponsorName ?? "")}`
      : "📣 Conteúdo publicitário"
    : nomeFonte
      ? `📰 Fonte: ${nomeFonte}`
      : "";
  const cta = limparTexto(entrada.cta ?? "") || CTA_PADRAO;
  const hashtags = gerarHashtags(entrada.template, entrada.hashtags ?? []);

  const blocos = [gancho, resumo, fonte, cta, hashtagsComoTexto(hashtags)].filter(
    (bloco) => bloco.length > 0,
  );

  return { gancho, resumo, fonte, cta, hashtags, texto: blocos.join("\n\n") };
}
