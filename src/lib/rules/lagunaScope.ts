/**
 * Filtro geográfico de Laguna — determinístico, puro e sem IA.
 *
 * Não acessa banco, Supabase, secrets nem rede. Recebe texto e devolve a
 * decisão de escopo: "local", "outside" ou "uncertain".
 *
 * INTEGRAÇÃO FUTURA (ainda NÃO feita) no pipeline de coleta:
 *   RSS → normalização → FILTRO GEOGRÁFICO → deduplicação → classificação
 *   → importance → INSERT
 */

import {
  BAIRROS_AMBIGUOS_LAGUNA,
  BAIRROS_LAGUNA,
  DISTRITOS_LAGUNA,
  DOMINIOS_OFICIAIS_LAGUNA,
  ENTIDADES_LAGUNA,
  LOCAIS_EXTERNOS,
  MUNICIPIOS_EXTERNOS,
  PONTOS_REFERENCIA_LAGUNA,
  REGIOES,
} from "./lagunaLocalities";

export type ScopeDecision = "local" | "outside" | "uncertain";

export interface EntradaEscopo {
  title: string;
  content?: string | null | undefined;
  source?: string | null | undefined;
}

export interface ResultadoEscopo {
  decision: ScopeDecision;
  /** true = local, false = fora, null = incerto. */
  in_scope: boolean | null;
  score: number;
  matched_localities: string[];
  matched_entities: string[];
  excluded_localities: string[];
  reason: string;
}

/* --------------------------------------------------------------- pesos */

const PESO_MUITO_FORTE = 6;
const PESO_FORTE = 4;
const PESO_MEDIO = 2;
const PESO_FRACO = 1;

/** Título pesa mais que o corpo. */
const FATOR_TITULO = 1.5;
const FATOR_CORPO = 1;

/** Pontuação mínima de Laguna para admitir decisão "local". */
export const LIMIAR_LOCAL = 4;
/** Pontuação mínima de município externo para admitir "outside". */
export const LIMIAR_OUTSIDE = 5;

/* --------------------------------------------------- normalização/matching */

export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&#?[a-z0-9]+;/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Casa palavra/expressão inteira (nunca substring ingênua). */
function contem(textoNormalizado: string, termo: string): boolean {
  const alvo = normalizarTexto(termo);
  if (!alvo) return false;
  const escapado = alvo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![a-z0-9])${escapado}(?![a-z0-9])`).test(textoNormalizado);
}

/* ------------------------------------------------------------- padrões */

/** Sinal muito forte: fato explicitamente situado em Laguna. */
const PADROES_MUITO_FORTES: RegExp[] = [
  /\bem laguna\b/,
  /\bmunicipio de laguna\b/,
  /\bcidade de laguna\b/,
  /\bprefeitura de laguna\b/,
  /\blaguna (?:celebra|amplia|recebe|registra|tera|tem|inaugura|anuncia|soma|inicia|abre|sedia|confirma)\b/,
  /\bpraias? de laguna\b/,
  /\bbairros? de laguna\b/,
  /\bruas? de laguna\b/,
  /\bcentro de laguna\b/,
  /\bporto de laguna\b/,
];

/** Sinal médio: Laguna como coletivo afetado, sem situar o fato. */
const PADROES_MEDIOS: RegExp[] = [
  /\bmoradores de laguna\b/,
  /\bpopulacao de laguna\b/,
  /\bcomunidade de laguna\b/,
  /\bcomerciantes de laguna\b/,
];

/** Sinal fraco: pessoa apenas originária de Laguna. */
const PADROES_PESSOA_DE_LAGUNA: RegExp[] = [
  /\b(?:homem|mulher|jovem|idoso|idosa|menino|menina|rapaz|crianca|motorista|motociclista|ciclista|natural|nascido|nascida|morador|moradora)\s+(?:de\s+\d+\s+anos\s+)?de laguna\b/,
];

/**
 * Fato compartilhado entre Laguna e outro município (ponte, divisa, rodovia).
 * Nunca decide "local" sozinho: no máximo "uncertain".
 */
const PADROES_COMPARTILHADOS: RegExp[] = [
  /\bentre laguna e\b/,
  /\be laguna\b(?=.*\b(?:divisa|limite|trecho)\b)/,
  /\bdivisa (?:entre|de|com) laguna\b/,
];

/** Verbos que indicam ocorrência do fato no local citado. */
const VERBOS_OCORRENCIA =
  "(?:acontece|ocorre|ocorreu|registra|registrado|registrada|deixa|termina|comeca|sera|foi|passa|tera|atinge|abre|inaugura|anuncia|prende|preso|presa)";



/* ------------------------------------------------------------- motor */

export function avaliarEscopoLaguna(entrada: EntradaEscopo): ResultadoEscopo {
  const titulo = normalizarTexto(entrada.title ?? "");
  const corpo = normalizarTexto(entrada.content ?? "");
  const fonte = (entrada.source ?? "").toLowerCase();

  const matched_localities: string[] = [];
  const matched_entities: string[] = [];
  const excluded_localities: string[] = [];
  const razoes: string[] = [];

  let scoreLaguna = 0;
  let temMuitoForte = false;
  let temForte = false;
  let temMedio = false;
  let temRegiao = false;

  const marcar = (peso: number, fator: number) => {
    scoreLaguna += peso * fator;
  };

  // fonte oficial do município: sinal muito forte
  if (DOMINIOS_OFICIAIS_LAGUNA.some((d) => fonte.includes(d))) {
    marcar(PESO_MUITO_FORTE, FATOR_TITULO);
    temMuitoForte = true;
    matched_entities.push("fonte oficial de Laguna");
    razoes.push("fonte oficial do município");
  }

  // padrões muito fortes
  for (const re of PADROES_MUITO_FORTES) {
    if (re.test(titulo)) {
      marcar(PESO_MUITO_FORTE, FATOR_TITULO);
      temMuitoForte = true;
      matched_localities.push("Laguna (título)");
      razoes.push("fato situado em Laguna no título");
      break;
    }
    if (re.test(corpo)) {
      marcar(PESO_MUITO_FORTE, FATOR_CORPO);
      temMuitoForte = true;
      matched_localities.push("Laguna (conteúdo)");
      razoes.push("fato situado em Laguna no conteúdo");
      break;
    }
  }

  // entidades exclusivas
  for (const ent of ENTIDADES_LAGUNA) {
    if (contem(titulo, ent)) {
      marcar(PESO_FORTE, FATOR_TITULO);
      matched_entities.push(ent);
      razoes.push(`entidade de Laguna no título: ${ent}`);
    } else if (contem(corpo, ent)) {
      marcar(PESO_FORTE, FATOR_CORPO);
      matched_entities.push(ent);
      razoes.push(`entidade de Laguna no conteúdo: ${ent}`);
    }
  }

  // bairros/distritos comprovados
  for (const loc of [...BAIRROS_LAGUNA, ...DISTRITOS_LAGUNA]) {
    if (contem(titulo, loc)) {
      marcar(PESO_FORTE, FATOR_TITULO);
      matched_localities.push(loc);
      razoes.push(`localidade de Laguna no título: ${loc}`);
    } else if (contem(corpo, loc)) {
      marcar(PESO_FORTE, FATOR_CORPO);
      matched_localities.push(loc);
      razoes.push(`localidade de Laguna no conteúdo: ${loc}`);
    }
  }

  // sinais médios (coletivo de Laguna afetado)
  for (const re of PADROES_MEDIOS) {
    if (re.test(titulo) || re.test(corpo)) {
      marcar(PESO_MEDIO, re.test(titulo) ? FATOR_TITULO : FATOR_CORPO);
      temMedio = true;
      matched_localities.push("moradores/comunidade de Laguna");
      razoes.push("coletivo de Laguna citado");
      break;
    }
  }

  // pessoa de Laguna: sinal fraco (nunca decide sozinho)
  const pessoaDeLaguna = PADROES_PESSOA_DE_LAGUNA.some(
    (re) => re.test(titulo) || re.test(corpo),
  );
  if (pessoaDeLaguna) {
    marcar(PESO_FRACO, FATOR_TITULO);
    razoes.push("pessoa de Laguna (sinal fraco)");
  }

  // menção solta de "laguna"
  const mencaoSolta = !temMuitoForte && !temMedio && !pessoaDeLaguna;
  if (mencaoSolta) {
    if (contem(titulo, "laguna")) {
      marcar(PESO_MEDIO, FATOR_TITULO);
      temMedio = true;
      matched_localities.push("Laguna (menção no título)");
      razoes.push("Laguna mencionada no título");
    } else if (contem(corpo, "laguna")) {
      marcar(PESO_FRACO, FATOR_CORPO);
      razoes.push("Laguna mencionada apenas no conteúdo (sinal fraco)");
    }
  }

  // ------------------------------------------------- municípios externos
  let scoreExterno = 0;
  for (const ext of [...MUNICIPIOS_EXTERNOS, ...LOCAIS_EXTERNOS]) {
    const alvo = normalizarTexto(ext);
    const ocorrencia = new RegExp(
      `\\b(?:em|no|na|de|do|da|para)\\s+${alvo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    );
    const prefeituraExterna = new RegExp(`\\bprefeitura de ${alvo}\\b`);
    const fatoNoTitulo =
      ocorrencia.test(titulo) ||
      prefeituraExterna.test(titulo) ||
      new RegExp(`\\b${alvo}\\s+${VERBOS_OCORRENCIA}\\b`).test(titulo);

    if (fatoNoTitulo) {
      scoreExterno += LIMIAR_OUTSIDE;
      excluded_localities.push(ext);
      razoes.push(`fato situado em ${ext} (título)`);
    } else if (ocorrencia.test(corpo) || prefeituraExterna.test(corpo)) {
      scoreExterno += 3;
      excluded_localities.push(ext);
      razoes.push(`município externo no conteúdo: ${ext}`);
    }
  }

  // ------------------------------------------------------------ decisão
  const score = Math.round((scoreLaguna - scoreExterno) * 100) / 100;
  let decision: ScopeDecision;

  if (temMuitoForte && scoreLaguna >= PESO_MUITO_FORTE) {
    decision = "local";
    razoes.push("evidência muito forte de Laguna prevalece");
  } else if (scoreLaguna >= LIMIAR_LOCAL && scoreExterno === 0) {
    decision = "local";
  } else if (scoreLaguna >= LIMIAR_LOCAL) {
    decision = "uncertain";
    razoes.push("conflito entre Laguna e município externo");
  } else if (scoreExterno >= LIMIAR_OUTSIDE && scoreLaguna < 3) {
    decision = "outside";
  } else {
    decision = "uncertain";
    if (razoes.length === 0) razoes.push("nenhuma localidade clara identificada");
  }

  return {
    decision,
    in_scope: decision === "local" ? true : decision === "outside" ? false : null,
    score,
    matched_localities: [...new Set(matched_localities)],
    matched_entities: [...new Set(matched_entities)],
    excluded_localities: [...new Set(excluded_localities)],
    reason: razoes.join("; ") || "sem sinais geográficos",
  };
}
