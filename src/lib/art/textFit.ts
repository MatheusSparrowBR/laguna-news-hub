/**
 * Ajuste de texto para as artes — determinístico e puro.
 *
 * Sem IA, sem DOM, sem rede: estimativa métrica por largura média de glifo,
 * suficiente para SVG com fonte de largura previsível.
 */

/** Largura média de um glifo em relação ao tamanho da fonte (peso bold). */
const RAZAO_GLIFO_BOLD = 0.55;
const RAZAO_GLIFO_REGULAR = 0.5;

export interface OpcoesAjuste {
  /** Largura útil em px (já descontada a safe area). */
  larguraMax: number;
  /** Altura útil em px. */
  alturaMax: number;
  fontSizeInicial: number;
  fontSizeMinimo: number;
  /** Multiplicador da altura de linha. */
  lineHeight?: number;
  peso?: "bold" | "regular";
  /** Passo de redução da fonte. */
  passo?: number;
}

export interface TextoAjustado {
  linhas: string[];
  fontSize: number;
  lineHeight: number;
  alturaTotal: number;
  /** true quando foi necessário truncar com reticências. */
  truncado: boolean;
}

/** Largura estimada de um texto em px. */
export function larguraEstimada(texto: string, fontSize: number, peso: "bold" | "regular"): number {
  const razao = peso === "bold" ? RAZAO_GLIFO_BOLD : RAZAO_GLIFO_REGULAR;
  return texto.length * fontSize * razao;
}

/** Quebra o texto em linhas que caibam na largura, sem cortar palavra. */
export function quebrarLinhas(
  texto: string,
  larguraMax: number,
  fontSize: number,
  peso: "bold" | "regular" = "bold",
): string[] {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = "";

  for (const palavra of palavras) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (larguraEstimada(tentativa, fontSize, peso) <= larguraMax || !atual) {
      atual = tentativa;
    } else {
      linhas.push(atual);
      atual = palavra;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/**
 * Reduz a fonte até o texto caber na caixa. Se ainda não couber no tamanho
 * mínimo, corta as linhas excedentes e marca a última com reticências —
 * o texto NUNCA sai da arte.
 */
export function ajustarTexto(texto: string, opcoes: OpcoesAjuste): TextoAjustado {
  const {
    larguraMax,
    alturaMax,
    fontSizeInicial,
    fontSizeMinimo,
    lineHeight = 1.15,
    peso = "bold",
    passo = 2,
  } = opcoes;

  const limpo = texto.replace(/\s+/g, " ").trim();
  if (!limpo) {
    return { linhas: [], fontSize: fontSizeInicial, lineHeight, alturaTotal: 0, truncado: false };
  }

  for (let fontSize = fontSizeInicial; fontSize >= fontSizeMinimo; fontSize -= passo) {
    const linhas = quebrarLinhas(limpo, larguraMax, fontSize, peso);
    const alturaTotal = linhas.length * fontSize * lineHeight;
    if (alturaTotal <= alturaMax) {
      return { linhas, fontSize, lineHeight, alturaTotal, truncado: false };
    }
  }

  // Não cabe nem no mínimo: trunca por número de linhas.
  const fontSize = fontSizeMinimo;
  const linhas = quebrarLinhas(limpo, larguraMax, fontSize, peso);
  const maxLinhas = Math.max(1, Math.floor(alturaMax / (fontSize * lineHeight)));
  const cortadas = linhas.slice(0, maxLinhas);
  const ultima = cortadas[cortadas.length - 1] ?? "";
  cortadas[cortadas.length - 1] = `${ultima.replace(/[\s,;:.-]+$/, "")}…`;
  return {
    linhas: cortadas,
    fontSize,
    lineHeight,
    alturaTotal: cortadas.length * fontSize * lineHeight,
    truncado: true,
  };
}

/* ------------------------------------------------------------- crop / cover */

export interface Retangulo {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Equivalente a object-fit: cover — calcula o retângulo de destino da imagem
 * preservando proporção e centralizando o excedente.
 */
export function calcularCover(
  imgLargura: number,
  imgAltura: number,
  caixa: Retangulo,
): Retangulo {
  if (imgLargura <= 0 || imgAltura <= 0) return caixa;
  const escala = Math.max(caixa.width / imgLargura, caixa.height / imgAltura);
  const width = imgLargura * escala;
  const height = imgAltura * escala;
  return {
    x: caixa.x + (caixa.width - width) / 2,
    y: caixa.y + (caixa.height - height) / 2,
    width,
    height,
  };
}
