/**
 * Lista central e editável de nomes geográficos usados pelo filtro de escopo.
 *
 * REGRA: só entram aqui nomes COMPROVADOS no conteúdo atual do projeto
 * (títulos, leads e URLs das notícias e fontes cadastradas).
 * Nomes duvidosos ficam em `ALIASES_PARA_REVISAO` e NÃO influenciam a decisão.
 */

/** Município alvo. */
export const MUNICIPIO = "Laguna";

/** Bairros/localidades de Laguna comprovados no conteúdo atual. */
export const BAIRROS_LAGUNA: string[] = [
  "Portinho", // "pavimentação de cinco ruas no bairro Portinho"
];

/** Distritos/comunidades comprovados no conteúdo atual. */
export const DISTRITOS_LAGUNA: string[] = [
  // Nenhum distrito apareceu de forma inequívoca nas notícias atuais.
];

/** Entidades/locais muito específicos e exclusivos de Laguna. */
export const ENTIDADES_LAGUNA: string[] = [
  "Prefeitura de Laguna",
  "Centro Administrativo Tordesilhas",
  "Cine Mussi",
  "Hospital Bom Jesus dos Passos",
  "Junta de Serviço Militar de Laguna",
  "Departamento Municipal de Esportes de Laguna",
];

/**
 * Nomes plausíveis de Laguna, porém NÃO encontrados no conteúdo atual.
 * Mantidos apenas para revisão manual futura — o motor os ignora.
 */
export const ALIASES_PARA_REVISAO: string[] = [
  "Mar Grosso",
  "Cabeçudas",
  "Magalhães",
  "Ponta da Barra",
  "Campo de Fora",
  "Farol de Santa Marta",
  "Molhes da Barra",
  "Ribeirão Pequeno",
];

/** Domínios de fontes que publicam exclusivamente sobre Laguna. */
export const DOMINIOS_OFICIAIS_LAGUNA: string[] = ["laguna.sc.gov.br"];

/** Municípios externos comprovadamente citados no conteúdo atual. */
export const MUNICIPIOS_EXTERNOS: string[] = [
  "Tubarão",
  "Criciúma",
  "Jaguaruna",
  "Imbituba",
  "Garopaba",
  "Capivari de Baixo",
  "Sangão",
  "Treze de Maio",
  "Palhoça",
];

/** Locais externos específicos comprovados (não municípios). */
export const LOCAIS_EXTERNOS: string[] = ["Praia da Pinheira"];
