/** Geração determinística de conteúdo de postagem. SEM IA. */
import { NOME_DO_PERFIL, APP_NAME } from "@/config/app";

export type TemplateKey =
  | "urgente" | "transito" | "seguranca" | "clima" | "prefeitura" | "cidade"
  | "eventos" | "turismo" | "esportes" | "saude" | "educacao" | "economia"
  | "comunidade" | "patrocinado";

export const TEMPLATE_KEYS: readonly TemplateKey[] = [
  "urgente", "transito", "seguranca", "clima", "prefeitura", "cidade", "eventos",
  "turismo", "esportes", "saude", "educacao", "economia", "comunidade", "patrocinado",
] as const;

const PREFIXOS: Record<TemplateKey, string> = {
  urgente: "🚨 URGENTE", transito: "🚧 TRÂNSITO", seguranca: "🚔 SEGURANÇA", clima: "🌧️ CLIMA",
  prefeitura: "🏛️ PREFEITURA", cidade: "📍 LAGUNA", eventos: "🎉 EVENTOS", turismo: "🏖️ TURISMO",
  esportes: "🏆 ESPORTES", saude: "🏥 SAÚDE", educacao: "🎓 EDUCAÇÃO", economia: "💼 ECONOMIA",
  comunidade: "👥 COMUNIDADE", patrocinado: "📣 PUBLICIDADE",
};
const ROTULOS: Record<TemplateKey, string> = {
  urgente: "Urgente", transito: "Trânsito", seguranca: "Segurança", clima: "Clima", prefeitura: "Prefeitura",
  cidade: "Cidade", eventos: "Eventos", turismo: "Turismo", esportes: "Esportes", saude: "Saúde",
  educacao: "Educação", economia: "Economia", comunidade: "Comunidade", patrocinado: "Patrocinado",
};
export function rotuloTemplate(key: TemplateKey): string { return ROTULOS[key]; }
export function prefixoTemplate(key: TemplateKey): string { return PREFIXOS[key]; }
export function templateParaNoticia(categoriaSlug: string | null | undefined, importanceScore = 0): TemplateKey {
  if (importanceScore >= 9) return "urgente";
  const slug = (categoriaSlug ?? "").toLowerCase();
  const encontrado = TEMPLATE_KEYS.find((k) => k === slug);
  if (encontrado && encontrado !== "patrocinado" && encontrado !== "comunidade") return encontrado;
  return "cidade";
}
export function limparTexto(texto: string): string {
  return texto.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\s+/g, " ").trim();
}
export function cortarEmPalavra(texto: string, limite: number): string {
  const limpo = limparTexto(texto); if (limite <= 0) return ""; if (limpo.length <= limite) return limpo;
  const fatia = limpo.slice(0, limite); const ultimoEspaco = fatia.lastIndexOf(" ");
  const base = ultimoEspaco > limite * 0.5 ? fatia.slice(0, ultimoEspaco) : fatia;
  return `${base.replace(/[\s,;:.-]+$/, "")}…`;
}
export function primeirasFrases(texto: string, limite = 320): string {
  const limpo = limparTexto(texto); if (!limpo) return "";
  const frases = limpo.split(/(?<=[.!?])\s+/); let saida = "";
  for (const frase of frases) { if (!saida) saida = frase; else if (`${saida} ${frase}`.length <= limite) saida = `${saida} ${frase}`; else break; }
  return saida.length > limite ? cortarEmPalavra(saida, limite) : saida;
}
export const TITULO_POST_MAX = 90;
export interface EntradaTituloPost { newsTitle: string; template: TemplateKey; sponsorName?: string | null; }
export function gerarTituloPost(entrada: EntradaTituloPost): string {
  const base = limparTexto(entrada.newsTitle);
  if (entrada.template === "patrocinado") {
    const nome = limparTexto(entrada.sponsorName ?? ""); const corpo = base || nome;
    return cortarEmPalavra(`${PREFIXOS.patrocinado}${nome && base ? ` • ${nome}` : ""}: ${corpo}`, TITULO_POST_MAX);
  }
  if (!base) return PREFIXOS[entrada.template];
  return cortarEmPalavra(`${PREFIXOS[entrada.template]}: ${base}`, TITULO_POST_MAX);
}
const HASHTAGS_BASE = ["#HoraNewsLaguna", "#Laguna", "#LagunaSC", "#NoticiasLaguna"] as const;
const HASHTAGS_CATEGORIA: Record<TemplateKey, readonly string[]> = {
  urgente: ["#Urgente", "#PlantaoLaguna"], transito: ["#Transito", "#BR101"], seguranca: ["#Seguranca", "#Policia"], clima: ["#Chuva", "#DefesaCivil"], prefeitura: ["#PrefeituraDeLaguna", "#ServicoPublico"], cidade: ["#CidadeDeLaguna"], eventos: ["#EventosLaguna", "#AgendaCultural"], turismo: ["#TurismoLaguna", "#PraiaDoMar"], esportes: ["#EsporteLaguna"], saude: ["#Saude", "#SaudePublica"], educacao: ["#Educacao", "#EscolaPublica"], economia: ["#Economia", "#Emprego"], comunidade: ["#Comunidade", "#RelatoDaComunidade"], patrocinado: ["#Publicidade", "#ApoieOLocal"],
};
export const HASHTAGS_MAX = 8;
export function gerarHashtags(template: TemplateKey, extras: readonly string[] = []): string[] {
  const normalizar = (tag: string) => { const limpa = tag.trim().replace(/^#+/, "").replace(/[^\p{L}\p{N}]/gu, ""); return limpa ? `#${limpa}` : ""; };
  const lista: string[] = []; const vistas = new Set<string>();
  for (const tag of [...HASHTAGS_BASE, ...HASHTAGS_CATEGORIA[template], ...extras]) { const normal = normalizar(tag); if (!normal) continue; const chave = normal.toLowerCase(); if (vistas.has(chave)) continue; vistas.add(chave); lista.push(normal); if (lista.length >= HASHTAGS_MAX) break; }
  return lista;
}
export function hashtagsComoTexto(tags: readonly string[]): string { return tags.join(" "); }
export interface EntradaLegendaPost { newsTitle: string; content?: string | null; sourceName?: string | null; sourceUrl?: string | null; template: TemplateKey; sponsorName?: string | null; cta?: string | null; hashtags?: readonly string[]; }
export interface LegendaPost { gancho: string; resumo: string; fonte: string; cta: string; hashtags: string[]; texto: string; }
const CTA_PADRAO = `Acompanhe o ${APP_NAME.replace("Projeto ", "")} ${NOME_DO_PERFIL} para mais informações.`;
export function gerarLegendaPost(entrada: EntradaLegendaPost): LegendaPost {
  const patrocinado = entrada.template === "patrocinado";
  const gancho = gerarTituloPost({ newsTitle: entrada.newsTitle, template: entrada.template, sponsorName: entrada.sponsorName ?? null });
  const resumo = primeirasFrases(entrada.content ?? "", 320); const nomeFonte = limparTexto(entrada.sourceName ?? "");
  const fonte = patrocinado ? (limparTexto(entrada.sponsorName ?? "") ? `📣 Publicidade: ${limparTexto(entrada.sponsorName ?? "")}` : "📣 Conteúdo publicitário") : (nomeFonte ? `📰 Fonte: ${nomeFonte}` : "");
  const cta = limparTexto(entrada.cta ?? "") || CTA_PADRAO; const hashtags = gerarHashtags(entrada.template, entrada.hashtags ?? []);
  return { gancho, resumo, fonte, cta, hashtags, texto: [gancho, resumo, fonte, cta, hashtagsComoTexto(hashtags)].filter(Boolean).join("\n\n") };
}
