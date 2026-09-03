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
  PALAVRAS_ENTIDADE_COMPOSTA,
  PALAVRAS_LOGRADOURO,
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

/* ------------------------------- entidades compostas e logradouros */

/** Gatilhos: o nome próprio que os segue pertence à entidade/endereço. */
const GATILHOS_COMPOSTOS = new Set<string>([
  ...PALAVRAS_LOGRADOURO.map((p) => normalizarTexto(p)),
  ...PALAVRAS_ENTIDADE_COMPOSTA.map((p) => normalizarTexto(p)),
]);

/** Conectivos que continuam o nome próprio ("Visconde DE Barbacena"). */
const CONECTIVOS_NOME = new Set(["de", "da", "do", "dos", "das"]);

/** Palavras que encerram o nome próprio e devolvem o texto ao contexto geográfico. */
const FIM_DE_NOME = new Set([
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "e",
  "com",
  "que",
  "para",
  "por",
  "pela",
  "pelo",
  "sobre",
  "apos",
  "durante",
  "ate",
  "entre",
  "nesta",
  "neste",
  "foi",
  "sera",
  "tem",
  "teve",
  "vai",
  "anuncia",
  "informa",
  "recebe",
  "registra",
]);

/** Máximo de palavras próprias absorvidas por uma entidade composta. */
const MAX_PALAVRAS_NOME = 4;

/**
 * Regra GERAL (sem lista de exceções): apaga do texto os nomes próprios que
 * são parte interna de um logradouro ou de uma entidade composta, para que
 * eles não sejam lidos como bairro/localidade.
 *
 * "ferrovia tereza cristina em laguna" → "ferrovia __ __ em laguna"
 *   (perde "Tereza" como bairro, mantém "em Laguna")
 * "rua visconde de barbacena em tubarao" → "rua __ __ __ em tubarao"
 */
export function mascararEntidadesCompostas(textoNormalizado: string): string {
  if (!textoNormalizado) return textoNormalizado;
  const tokens = textoNormalizado.split(" ");
  const saida = [...tokens];

  for (let i = 0; i < tokens.length; i += 1) {
    if (!GATILHOS_COMPOSTOS.has(tokens[i] ?? "")) continue;
    let proprias = 0;
    for (let j = i + 1; j < tokens.length && proprias < MAX_PALAVRAS_NOME; j += 1) {
      const token = tokens[j] ?? "";
      if (FIM_DE_NOME.has(token)) break;
      saida[j] = "__";
      if (!CONECTIVOS_NOME.has(token)) proprias += 1;
    }
  }

  return saida.join(" ");
}

/* ------------------------------------------------------------- motor */

export function avaliarEscopoLaguna(entrada: EntradaEscopo): ResultadoEscopo {
  const titulo = normalizarTexto(entrada.title ?? "");
  const corpo = normalizarTexto(entrada.content ?? "");
  /** Texto sem os nomes internos de logradouros/entidades compostas. */
  const tituloGeo = mascararEntidadesCompostas(titulo);
  const corpoGeo = mascararEntidadesCompostas(corpo);
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
  /** true quando o único sinal muito forte veio do domínio oficial. */
  let muitoForteApenasFonte = false;

  const marcar = (peso: number, fator: number) => {
    scoreLaguna += peso * fator;
  };

  // fonte oficial do município: sinal muito forte
  if (DOMINIOS_OFICIAIS_LAGUNA.some((d) => fonte.includes(d))) {
    marcar(PESO_MUITO_FORTE, FATOR_TITULO);
    temMuitoForte = true;
    muitoForteApenasFonte = true;
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
      temForte = true;
      matched_entities.push(ent);
      razoes.push(`entidade de Laguna no título: ${ent}`);
    } else if (contem(corpo, ent)) {
      marcar(PESO_FORTE, FATOR_CORPO);
      temForte = true;
      matched_entities.push(ent);
      razoes.push(`entidade de Laguna no conteúdo: ${ent}`);
    }
  }

  // pontos de referência exclusivos (sinal forte contextual)
  for (const ref of PONTOS_REFERENCIA_LAGUNA) {
    if (contem(titulo, ref)) {
      marcar(PESO_FORTE, FATOR_TITULO);
      temForte = true;
      matched_entities.push(ref);
      razoes.push(`ponto de referência de Laguna no título: ${ref}`);
    } else if (contem(corpo, ref)) {
      marcar(PESO_FORTE, FATOR_CORPO);
      temForte = true;
      matched_entities.push(ref);
      razoes.push(`ponto de referência de Laguna no conteúdo: ${ref}`);
    }
  }

  // bairros/distritos comprovados — lidos no texto SEM entidades compostas
  for (const loc of [...BAIRROS_LAGUNA, ...DISTRITOS_LAGUNA]) {
    const noTitulo = contem(tituloGeo, loc);
    const noCorpo = contem(corpoGeo, loc);
    if (!noTitulo && !noCorpo) {
      // nome existia apenas dentro de logradouro/entidade composta
      if (contem(titulo, loc) || contem(corpo, loc)) {
        razoes.push(`"${loc}" ignorado: nome interno de logradouro/entidade`);
      }
      continue;
    }
    marcar(PESO_FORTE, noTitulo ? FATOR_TITULO : FATOR_CORPO);
    temForte = true;
    matched_localities.push(loc);
    razoes.push(
      `localidade de Laguna no ${noTitulo ? "título" : "conteúdo"}: ${loc}`,
    );
  }

  // bairros de nome ambíguo: só pontuam com Laguna presente no texto, e ainda
  // assim como sinal MÉDIO — nunca decidem "local" sozinhos.
  const lagunaPresente =
    temMuitoForte || temForte || contem(titulo, "laguna") || contem(corpo, "laguna");
  for (const loc of BAIRROS_AMBIGUOS_LAGUNA) {
    const noTitulo = contem(tituloGeo, loc);
    const noCorpo = contem(corpoGeo, loc);
    if (!noTitulo && !noCorpo) {
      if (contem(titulo, loc) || contem(corpo, loc)) {
        razoes.push(`"${loc}" ignorado: nome interno de logradouro/entidade`);
      }
      continue;
    }
    if (!lagunaPresente) {
      razoes.push(`bairro ambíguo "${loc}" sem contexto de Laguna: ignorado`);
      continue;
    }
    marcar(PESO_MEDIO, noTitulo ? FATOR_TITULO : FATOR_CORPO);
    temMedio = true;
    matched_localities.push(`${loc} (ambíguo)`);
    razoes.push(`bairro de nome ambíguo: ${loc}`);
  }

  // regiões: nem local nem outside por si só
  for (const reg of REGIOES) {
    if (contem(titulo, reg) || contem(corpo, reg)) {
      temRegiao = true;
      razoes.push(`referência regional: ${reg}`);
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

  // ------------------------------------------------------- travas finais
  const fatoCompartilhado = PADROES_COMPARTILHADOS.some(
    (re) => re.test(titulo) || re.test(corpo),
  );
  if (decision === "local" && fatoCompartilhado) {
    decision = "uncertain";
    razoes.push("fato compartilhado entre Laguna e outro município");
  }
  // sinal médio/fraco (bairro ambíguo, coletivo, menção solta) nunca decide só
  if (decision === "local" && !temMuitoForte && !temForte) {
    decision = "uncertain";
    razoes.push("apenas sinais médios/fracos de Laguna");
  }
  // região sem município/localidade específica nunca gera local nem outside
  if (temRegiao && !temMuitoForte && !temForte) {
    if (decision === "local") {
      decision = "uncertain";
      razoes.push("referência apenas regional");
    }
    if (decision === "outside" && scoreExterno < LIMIAR_OUTSIDE) {
      decision = "uncertain";
      razoes.push("região não identifica município");
    }
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
