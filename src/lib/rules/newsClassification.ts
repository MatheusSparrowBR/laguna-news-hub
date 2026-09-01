/**
 * Motor de classificação por regras (puro / determinístico).
 *
 * Sem IA, sem rede, sem banco, sem secrets: recebe texto, devolve categoria
 * e importance_score. Usado pela coleta antes do INSERT em `news` e pela
 * função de diagnóstico (que apenas simula, sem gravar).
 */

/** Slugs das categorias já existentes no banco (não criar novas). */
export type CategoriaSlug =
  | "urgente"
  | "transito"
  | "seguranca"
  | "prefeitura"
  | "cidade"
  | "eventos"
  | "turismo"
  | "clima"
  | "esportes"
  | "economia"
  | "educacao"
  | "saude";

export interface EntradaClassificacao {
  title: string;
  content?: string | null | undefined;
  source?: string | null | undefined;
}

export interface ResultadoClassificacao {
  /** UUID da categoria, quando o mapa slug→id é informado; caso contrário null. */
  category_id: string | null;
  category_slug: CategoriaSlug;
  category_name: string;
  importance_score: number;
  matched_keywords: string[];
  /** Pontuação por categoria (diagnóstico). */
  scores: Record<CategoriaSlug, number>;
}

export const NOME_CATEGORIA: Record<CategoriaSlug, string> = {
  urgente: "Urgente",
  transito: "Trânsito",
  seguranca: "Segurança",
  prefeitura: "Prefeitura",
  cidade: "Cidade",
  eventos: "Eventos",
  turismo: "Turismo",
  clima: "Clima",
  esportes: "Esportes",
  economia: "Economia",
  educacao: "Educação",
  saude: "Saúde",
};

/** Desempate: primeiro da lista ganha. */
export const PRIORIDADE_CATEGORIA: CategoriaSlug[] = [
  "urgente",
  "seguranca",
  "transito",
  "clima",
  "saude",
  "prefeitura",
  "esportes",
  "eventos",
  "turismo",
  "economia",
  "educacao",
  "cidade",
];

/** Categoria usada quando nenhuma atinge o limiar mínimo. */
export const CATEGORIA_PADRAO: CategoriaSlug = "cidade";

/** Limiar mínimo de pontuação para aceitar uma categoria. */
export const LIMIAR_MINIMO = 4;

interface Palavra {
  /** Termo (pode ter espaços/hífen); comparado sem acento e sem caixa. */
  termo: string;
  /** Peso: 3 = específico, 2 = médio, 1 = genérico. */
  peso: 1 | 2 | 3;
  /** Só pontua se ao menos um destes termos também aparecer no texto. */
  requer?: string[];
}

function p(peso: 1 | 2 | 3, ...termos: string[]): Palavra[] {
  return termos.map((termo) => ({ termo, peso }));
}

/** Termo composto: só pontua quando acompanhado de um dos termos de contexto. */
function c(peso: 1 | 2 | 3, termo: string, ...requer: string[]): Palavra {
  return { termo, peso, requer };
}

const CTX_CRIME = [
  "facada",
  "facadas",
  "tiro",
  "tiros",
  "baleado",
  "homicídio",
  "assassinato",
  "assassinado",
  "assassinada",
  "crime",
  "corpo",
  "polícia",
  "esfaqueado",
  "esfaqueada",
];

const CTX_TRANSITO = [
  "acidente",
  "colisão",
  "batida",
  "capotamento",
  "atropelamento",
  "interditada",
  "interdição",
  "bloqueio",
  "lentidão",
  "trânsito lento",
  "congestionamento",
  "engarrafamento",
  "tráfego",
];

const CTX_ESCOLA = [
  "alunos",
  "aluno",
  "estudantes",
  "professores",
  "professor",
  "matrícula",
  "matrículas",
  "ensino",
  "educação",
  "merenda",
  "sala de aula",
];

/** Contexto de saúde: "paciente" isolado não basta. */
const CTX_SAUDE = [
  "hospital",
  "ubs",
  "médico",
  "médica",
  "médicos",
  "atendimento",
  "consulta",
  "tratamento",
  "vacina",
  "vacinação",
  "doença",
  "saúde",
  "enfermagem",
  "enfermeiro",
  "sus",
  "internado",
  "internação",
  "posto de saúde",
];

/** Contexto turístico: "praia", "hotel" e "patrimônio" isolados não bastam. */
const CTX_TURISMO = [
  "turismo",
  "turista",
  "turistas",
  "visitantes",
  "visitação",
  "hospedagem",
  "pousada",
  "ocupação",
  "temporada",
  "feriado",
  "veraneio",
  "banhistas",
  "diárias",
  "atração",
  "atrativo",
];


const REGRAS: Record<CategoriaSlug, Palavra[]> = {
  urgente: [
    ...p(3, "alerta vermelho", "estado de emergência", "estado de calamidade", "evacuação", "situação de emergência"),
    ...p(2, "urgente", "emergência", "risco iminente"),
    ...p(1, "alerta", "risco", "perigo"),
  ],
  transito: [
    ...p(3, "congestionamento", "engarrafamento", "pista interditada", "pista bloqueada", "pista liberada", "pista da rodovia", "pista de rolamento", "rodovia interditada", "trânsito lento", "acidente de trânsito"),
    ...p(2, "trânsito", "rodovia", "acidente", "colisão", "batida", "capotamento", "atropelamento", "lentidão", "tráfego", "desvio", "interdição", "bloqueio"),
    ...p(1, "veículo", "carro", "moto", "caminhão", "motorista"),
    // "pista" isolada é genérica (aeroporto, pista de atletismo): só pontua com contexto
    ...p(1, "pista"),
    c(3, "pista", ...CTX_TRANSITO),
    // BR-101 / SC-436 sozinhas: peso moderado; com contexto de trânsito: peso alto
    ...p(1, "br-101", "br 101", "sc-436", "sc 436", "sc-100"),
    c(3, "br-101", ...CTX_TRANSITO),
    c(3, "br 101", ...CTX_TRANSITO),
    c(3, "sc-436", ...CTX_TRANSITO),
  ],

  seguranca: [
    // crimes específicos: peso máximo
    ...p(3, "homicídio", "feminicídio", "assassinato", "assassinado", "assassinada", "tentativa de homicídio", "latrocínio", "estupro", "abuso sexual", "esfaqueado", "esfaqueada", "facada", "facadas", "morto a facadas", "morta a facadas"),
    // drogas: peso máximo
    ...p(3, "tráfico", "tráfico de drogas", "traficante", "maconha", "cocaína", "crack", "entorpecente", "entorpecentes", "apreensão de drogas", "porções de maconha", "porções de cocaína"),
    ...p(3, "polícia civil", "polícia militar", "operação policial", "delegacia", "assalto", "investigação criminal", "fraude", "fraudes"),
    ...p(2, "polícia", "prisão", "preso", "presa", "presos", "detido", "detida", "roubo", "furto", "crime", "drogas", "droga", "investigação", "apreensão", "arma de fogo"),
    ...p(1, "operação", "suspeito", "vítima", "bombeiros"),
    // contexto de morte: só reforça Segurança quando há indício de crime
    c(3, "morto", ...CTX_CRIME),
    c(3, "morta", ...CTX_CRIME),
    c(2, "morte", ...CTX_CRIME),
    c(2, "vítima", "crime", "corpo", "homicídio", "facada", "facadas", "assassinato"),
  ],
  prefeitura: [
    ...p(3, "prefeitura de laguna", "prefeitura anuncia", "prefeitura inicia", "prefeitura entrega", "secretaria municipal", "edital municipal", "obra pública", "câmara de vereadores", "vereadores"),
    ...p(3, "prefeitura", "prefeito"),
    ...p(2, "secretaria", "secretário", "administração municipal", "serviço público", "licitação", "decreto"),
    ...p(1, "municipal", "município", "gestão"),
  ],
  cidade: [
    ...p(2, "moradores", "bairro", "comunidade", "comércio local", "centro da cidade"),
    ...p(1, "cidade", "laguna", "centro", "rua", "população"),
  ],
  eventos: [
    ...p(3, "festival", "carnaval", "programação cultural", "show", "feira livre", "feira de artesanato", "feira cultural", "feira gastronômica", "feira de negócios"),
    ...p(2, "evento", "festa", "programação", "atração", "apresentação", "encontro cultural", "desfile"),
    ...p(1, "música", "cultura", "feira"),
  ],
  turismo: [
    ...p(3, "turismo", "turista", "turistas", "atração turística", "ponto turístico", "roteiro turístico", "destino turístico", "turismo cultural", "turismo histórico", "turismo de praia", "farol de santa marta", "praias de laguna", "ocupação hoteleira", "temporada de verão", "hospedagem", "pousada"),
    ...p(2, "visitantes", "visitação", "veraneio", "banhistas", "hotelaria", "patrimônio histórico", "passeio"),
    // termos genéricos: só ganham peso com contexto turístico
    ...p(1, "verão", "roteiro", "praia", "praias", "patrimônio", "hotel"),
    c(3, "praia", ...CTX_TURISMO),
    c(3, "praias", ...CTX_TURISMO),
    c(3, "hotel", ...CTX_TURISMO),
    c(2, "patrimônio", ...CTX_TURISMO),
  ],

  clima: [
    ...p(3, "defesa civil", "temporal", "temporais", "tempestade", "granizo", "alagamento", "enchente", "ciclone", "ressaca", "alerta de chuva", "vento forte"),
    ...p(2, "chuva", "chuvas", "vento", "previsão do tempo", "frente fria", "onda de calor", "mm de chuva"),
    ...p(1, "previsão", "calor", "frio", "tempo"),
  ],
  esportes: [
    ...p(3, "campeonato", "futebol", "torneio", "atleta", "modalidade esportiva"),
    ...p(2, "jogo", "partida", "time", "equipe esportiva", "treinador", "medalha"),
    ...p(1, "esporte", "esportivo"),
  ],
  economia: [
    ...p(3, "vagas de emprego", "investimento", "empreendedor", "geração de emprego", "salário"),
    ...p(2, "emprego", "vagas", "economia", "empresa", "comércio", "negócios", "renda"),
    ...p(1, "mercado", "custo"),
  ],
  educacao: [
    ...p(3, "escolas municipais", "rede municipal de ensino", "unidade escolar", "matrícula", "matrículas", "creche", "universidade", "professores"),
    ...p(2, "educação", "aluno", "alunos", "estudantes", "professor", "ensino"),
    ...p(1, "curso", "aula", "escola"),
    // "escola" só ganha peso com contexto escolar
    c(3, "escola", ...CTX_ESCOLA),
  ],
  saude: [
    ...p(3, "hospital", "ubs", "vacinação", "posto de saúde", "saúde pública", "sus", "epidemia", "surto"),
    ...p(2, "saúde", "vacina", "atendimento médico", "médico", "enfermeiro", "doença", "dengue"),
    ...p(1, "atendimento", "paciente"),
  ],
};


/** Palavras que elevam diretamente a importância (nunca sozinhas até 10). */
const ALTA_PRIORIDADE: Array<{ termo: string; pontos: number }> = [
  { termo: "morte", pontos: 3 },
  { termo: "morreu", pontos: 3 },
  { termo: "mortes", pontos: 3 },
  { termo: "feminicídio", pontos: 4 },
  { termo: "homicídio", pontos: 4 },
  { termo: "desaparecido", pontos: 3 },
  { termo: "desaparecimento", pontos: 3 },
  { termo: "acidente grave", pontos: 4 },
  { termo: "grave acidente", pontos: 4 },
  { termo: "interdição", pontos: 2 },
  { termo: "interditada", pontos: 2 },
  { termo: "evacuação", pontos: 4 },
  { termo: "alerta", pontos: 2 },
  { termo: "emergência", pontos: 3 },
  { termo: "desastre", pontos: 4 },
  { termo: "temporal", pontos: 3 },
  { termo: "tempestade", pontos: 3 },
  { termo: "alagamento", pontos: 3 },
  { termo: "enchente", pontos: 3 },
  { termo: "risco", pontos: 2 },
  { termo: "perigo", pontos: 2 },
  { termo: "vítima", pontos: 2 },
  { termo: "resgate", pontos: 2 },
];

/** Base de importância por categoria. */
const BASE_IMPORTANCIA: Record<CategoriaSlug, number> = {
  urgente: 8,
  seguranca: 6,
  transito: 6,
  clima: 6,
  saude: 5,
  prefeitura: 5,
  cidade: 4,
  economia: 4,
  educacao: 4,
  eventos: 3,
  turismo: 3,
  esportes: 3,
};

/* ------------------------------------------------------------- utilidades */

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Conta ocorrências de palavra/expressão inteira.
 * A fronteira exclui letras, dígitos e hífen: "feira" NÃO casa em "terça-feira",
 * mas "feira livre" casa normalmente e "br-101" continua casando.
 */
function contaOcorrencias(textoNormalizado: string, termo: string): number {
  const alvo = normalizar(termo);
  if (!alvo) return 0;
  const escapado = alvo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?<![a-z0-9-])${escapado}(?![a-z0-9-])`, "g");
  return (textoNormalizado.match(regex) ?? []).length;
}

/** Verifica se algum termo de contexto aparece no título ou no conteúdo. */
function temContexto(titulo: string, corpo: string, requer: string[]): boolean {
  return requer.some(
    (t) => contaOcorrencias(titulo, t) > 0 || contaOcorrencias(corpo, t) > 0,
  );
}


/* -------------------------------------------------------------- motor puro */

/**
 * Classifica uma notícia usando apenas regras determinísticas.
 * `categoriaIds` é opcional: mapa slug → uuid vindo da tabela `categories`.
 * Sem ele, `category_id` volta como null (o motor nunca inventa id).
 */
export function classificarNoticia(
  entrada: EntradaClassificacao,
  categoriaIds?: Partial<Record<CategoriaSlug, string>>,
): ResultadoClassificacao {
  const titulo = normalizar(entrada.title ?? "");
  const corpo = normalizar(entrada.content ?? "");
  const fonte = normalizar(entrada.source ?? "");

  const scores = {} as Record<CategoriaSlug, number>;
  const encontradas = new Map<string, number>();

  for (const slug of Object.keys(REGRAS) as CategoriaSlug[]) {
    // melhor pontuação por termo: evita contar duas vezes o mesmo termo
    // quando ele aparece como regra simples e como regra com contexto.
    const porTermo = new Map<string, number>();

    for (const { termo, peso, requer } of REGRAS[slug]) {
      if (requer && !temContexto(titulo, corpo, requer)) continue;

      const noTitulo = contaOcorrencias(titulo, termo);
      const noCorpo = contaOcorrencias(corpo, termo);
      if (noTitulo === 0 && noCorpo === 0) continue;

      // título pesa 3x; conteúdo 1x (limitado a 2 ocorrências para não inflar)
      const relevancia = peso * 3 * Math.min(noTitulo, 2) + peso * Math.min(noCorpo, 2);
      if (relevancia > (porTermo.get(termo) ?? 0)) porTermo.set(termo, relevancia);
    }

    let pontos = 0;
    for (const [termo, relevancia] of porTermo) {
      pontos += relevancia;
      if (relevancia > (encontradas.get(termo) ?? 0)) encontradas.set(termo, relevancia);
    }

    // bônus por combinação de palavras diferentes (evita palavra genérica isolada)
    const distintas = porTermo.size;
    if (distintas >= 2) pontos += 2;
    if (distintas >= 3) pontos += 2;

    scores[slug] = pontos;
  }


  const candidatas = PRIORIDADE_CATEGORIA.filter((slug) => scores[slug] >= LIMIAR_MINIMO);
  let escolhida: CategoriaSlug = CATEGORIA_PADRAO;
  if (candidatas.length > 0) {
    escolhida = candidatas.reduce((melhor, atual) =>
      scores[atual] > scores[melhor] ? atual : melhor,
    );
  }

  const matched_keywords = [...encontradas.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([termo]) => termo);

  const importance_score = calcularImportancia({
    slug: escolhida,
    titulo,
    corpo,
    fonte,
    pontuacao: scores[escolhida] ?? 0,
  });

  return {
    category_id: categoriaIds?.[escolhida] ?? null,
    category_slug: escolhida,
    category_name: NOME_CATEGORIA[escolhida],
    importance_score,
    matched_keywords,
    scores,
  };
}

function calcularImportancia(args: {
  slug: CategoriaSlug;
  titulo: string;
  corpo: string;
  fonte: string;
  pontuacao: number;
}): number {
  const { slug, titulo, corpo, fonte, pontuacao } = args;
  let score = BASE_IMPORTANCIA[slug];

  // palavras de alta prioridade: título vale integral, conteúdo metade
  let extra = 0;
  for (const { termo, pontos } of ALTA_PRIORIDADE) {
    if (contaOcorrencias(titulo, termo) > 0) extra += pontos;
    else if (contaOcorrencias(corpo, termo) > 0) extra += pontos / 2;
  }
  // teto do reforço para nenhuma palavra isolada virar 10 automaticamente
  score += Math.min(extra, 4);

  // relevância local
  const local = ["laguna", "laguna sc", "magamluna"].some(
    (t) => contaOcorrencias(titulo, t) > 0,
  );
  if (local) score += 1;
  else if (contaOcorrencias(corpo, "laguna") > 0 || contaOcorrencias(fonte, "laguna") > 0) {
    score += 0.5;
  }

  // aderência às regras (sinal forte de categoria)
  // sinal muito forte de categoria: bônus só até 8, para 9/10 exigirem termo grave
  if (pontuacao >= 20 && score < 8) score += 1;

  else if (pontuacao < LIMIAR_MINIMO) score -= 1;

  return Math.max(0, Math.min(10, Math.round(score)));
}

/* --------------------------------------------------------------- diagnóstico */

export interface DiagnosticoClassificacao {
  categoria_prevista: string;
  categoria_slug: CategoriaSlug;
  importance_score: number;
  matched_keywords: string[];
  scores: Record<CategoriaSlug, number>;
}

/** Simula a classificação sem tocar no banco (uso em testes/validação). */
export function diagnosticarClassificacao(
  title: string,
  content?: string | null,
  source?: string | null,
): DiagnosticoClassificacao {
  const r = classificarNoticia({ title, content, source });
  return {
    categoria_prevista: r.category_name,
    categoria_slug: r.category_slug,
    importance_score: r.importance_score,
    matched_keywords: r.matched_keywords,
    scores: r.scores,
  };
}
