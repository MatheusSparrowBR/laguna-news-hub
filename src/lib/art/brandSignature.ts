/**
 * Assinatura visual HORA NEWS LAGUNA em SVG — fundo transparente.
 *
 * Farol + ondas + nome + slogan, usando somente a paleta oficial.
 * NUNCA desenha faixa azul sólida: apenas o desenho, com sombra discreta
 * para continuar legível sobre qualquer fotografia.
 */

import { MARCA } from "./artTemplates";

export type PosicaoAssinatura = "inferior-esquerdo" | "inferior-direito" | "inferior-centro";

const FONTE = "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Largura de referência do desenho da assinatura (é escalado por transform). */
export const LARGURA_BASE = 640;
export const ALTURA_BASE = 150;

/** Desenho do farol sobre o mar, em coordenadas locais 0..110. */
function farol(): string {
  return [
    `<g>`,
    // luz do farol (amarelo)
    `<path d="M62 34 L110 16 L110 52 Z" fill="${MARCA.accent}" opacity="0.85"/>`,
    // torre
    `<path d="M34 30 L54 30 L60 104 L28 104 Z" fill="${MARCA.white}"/>`,
    `<path d="M36 44 L52 44 L54 58 L34 58 Z" fill="${MARCA.secondary}"/>`,
    `<path d="M38 70 L56 70 L57 84 L37 84 Z" fill="${MARCA.secondary}"/>`,
    // lanterna
    `<rect x="36" y="16" width="16" height="14" rx="3" fill="${MARCA.accent}"/>`,
    // ondas
    `<path d="M0 112 q14 -12 28 0 q14 12 28 0 q14 -12 28 0 q14 12 28 0" fill="none" stroke="${MARCA.white}" stroke-width="7" stroke-linecap="round"/>`,
    `<path d="M0 130 q14 -12 28 0 q14 12 28 0 q14 -12 28 0 q14 12 28 0" fill="none" stroke="${MARCA.accent}" stroke-width="6" stroke-linecap="round"/>`,
    `</g>`,
  ].join("");
}

export interface OpcoesAssinatura {
  /** Coordenada X do canto superior esquerdo do desenho. */
  x: number;
  /** Coordenada Y do canto superior esquerdo do desenho. */
  y: number;
  /** Escala aplicada ao desenho base (640×150). */
  escala: number;
  /** Sobre foto escura usa branco; sobre área clara usa azul principal. */
  sobreClaro?: boolean;
}

/**
 * Assinatura completa: farol, HORA NEWS, LAGUNA e slogan.
 * Renderiza um grupo SVG transparente pronto para sobrepor a fotografia.
 */
export function assinaturaSvg(opcoes: OpcoesAssinatura): string {
  const claro = opcoes.sobreClaro === true;
  const corNome = claro ? MARCA.primary : MARCA.white;
  const corSlogan = claro ? MARCA.secondary : MARCA.white;
  const sombra = claro ? "" : ` filter="url(#assinaturaSombra)"`;

  return [
    `<g transform="translate(${opcoes.x} ${opcoes.y}) scale(${opcoes.escala})"${sombra}>`,
    farol(),
    `<text x="132" y="52" font-family="${FONTE}" font-size="54" font-weight="800" letter-spacing="1" fill="${corNome}">HORA NEWS</text>`,
    `<text x="132" y="98" font-family="${FONTE}" font-size="42" font-weight="700" letter-spacing="8" fill="${MARCA.accent}">LAGUNA</text>`,
    `<text x="132" y="130" font-family="${FONTE}" font-size="20" font-weight="600" letter-spacing="2" fill="${corSlogan}" opacity="${claro ? 1 : 0.92}">INFORMAÇÃO QUE CONECTA NOSSA CIDADE</text>`,
    `</g>`,
  ].join("");
}

/** Filtro de sombra discreta usado pela assinatura e pelo título. */
export function filtroSombra(): string {
  return [
    `<filter id="assinaturaSombra" x="-20%" y="-20%" width="140%" height="140%">`,
    `<feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="${MARCA.text}" flood-opacity="0.55"/>`,
    `</filter>`,
  ].join("");
}
