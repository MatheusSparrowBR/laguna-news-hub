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
  content?: string | null;
  source?: string | null;
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
}

function p(peso: 1 | 2 | 3, ...termos: string[]): Palavra[] {
  return termos.map((termo) => ({ termo, peso }));
}

const REGRAS: Record<CategoriaSlug, Palavra[]> = {
  urgente: [
    ...p(3, "alerta vermelho", "estado de emergência", "evacuação", "evacuacao", "situação de emergência"),
    ...p(2, "urgente", "emergência", "interdição", "interditada", "interditado", "risco iminente"),
    ...p(1, "alerta", "risco", "perigo"),
  ],
  transito: [
    ...p(3, "br-101", "br 101", "sc-436", "sc 436", "sc-100", "engarrafamento", "congestionamento", "pista interditada"),
    ...p(2, "trânsito", "rodovia", "acidente", "colisão", "capotamento", "atropelamento", "desvio", "detour", "interdição"),
    ...p(1, "veículo", "carro", "moto", "caminhão", "motorista"),
  ],
  seguranca: [
    ...p(3, "polícia civil", "polícia militar", "feminicídio", "homicídio", "assalto", "tráfico", "delegacia", "latrocínio"),
    ...p(2, "polícia", "prisão", "preso", "detido", "roubo", "furto", "crime", "investigação", "apreensão", "bombeiros"),
    ...p(1, "operação", "suspeito", "vítima", "pm"),
  ],
  prefeitura: [
    ...p(3, "prefeitura", "prefeito", "edital municipal", "obra pública", "câmara de vereadores", "vereadores"),
    ...p(2, "secretaria", "secretário", "administração municipal", "serviço público", "licitação", "decreto"),
    ...p(1, "municipal", "município", "gestão"),
  ],
  cidade: [
    ...p(2, "moradores", "bairro", "comunidade", "comércio local", "centro da cidade"),
    ...p(1, "cidade", "laguna", "centro", "rua", "população"),
  ],
  eventos: [
    ...p(3, "festival", "carnaval", "programação cultural", "feira", "show"),
    ...p(2, "evento", "festa", "programação", "atração", "apresentação", "encontro cultural"),
    ...p(1, "música", "cultura"),
  ],
  turismo: [
    ...p(3, "turismo", "turistas", "atração turística", "roteiro turístico", "farol de santa marta", "temporada de verão"),
    ...p(2, "visitantes", "praia", "praias", "passeio", "patrimônio", "pousada", "hotelaria"),
    ...p(1, "verão", "roteiro"),
  ],
  clima: [
    ...p(3, "defesa civil", "temporal", "tempestade", "granizo", "alagamento", "enchente", "ciclone", "ressaca", "alerta de chuva"),
    ...p(2, "chuva", "vento", "previsão do tempo", "frente fria", "onda de calor"),
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
    ...p(3, "escolas municipais", "matrícula", "matrículas", "creche", "universidade", "professores"),
    ...p(2, "escola", "educação", "aluno", "alunos", "professor", "ensino", "rede municipal de ensino"),
    ...p(1, "curso", "aula"),
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

function contaOcorrencias(textoNormalizado: string, termo: string): number {
  const alvo = normalizar(termo);
  if (!alvo) return 0;
  const escapado = alvo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?<![a-z0-9])${escapado}(?![a-z0-9])`, "g");
  return (textoNormalizado.match(regex) ?? []).length;
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
    let pontos = 0;
    let distintas = 0;

    for (const { termo, peso } of REGRAS[slug]) {
      const noTitulo = contaOcorrencias(titulo, termo);
      const noCorpo = contaOcorrencias(corpo, termo);
      if (noTitulo === 0 && noCorpo === 0) continue;

      distintas++;
      // título pesa 3x; conteúdo 1x (limitado a 2 ocorrências para não inflar)
      pontos += peso * 3 * Math.min(noTitulo, 2) + peso * Math.min(noCorpo, 2);
      const anterior = encontradas.get(termo) ?? 0;
      const relevancia = peso * 3 * Math.min(noTitulo, 2) + peso * Math.min(noCorpo, 2);
      if (relevancia > anterior) encontradas.set(termo, relevancia);
    }

    // bônus por combinação de palavras diferentes (evita palavra genérica isolada)
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
  if (pontuacao >= 20) score += 1;
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
