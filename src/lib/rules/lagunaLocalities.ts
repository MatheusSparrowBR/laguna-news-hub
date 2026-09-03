/**
 * Lista central e editável de nomes geográficos usados pelo filtro de escopo.
 *
 * REGRA: só entram aqui nomes COMPROVADOS — no conteúdo atual do projeto
 * (títulos, leads e URLs das notícias) ou em páginas oficiais da Prefeitura de
 * Laguna (laguna.sc.gov.br: "Bairros", "ESFs/Endereços", "Transporte Escolar").
 * Nomes duvidosos ficam em `ALIASES_PARA_REVISAO` e NÃO influenciam a decisão.
 *
 * Nomes genéricos, que existem também em outros municípios da região
 * (ex.: "Passagem" em Tubarão, "Barbacena" como rua em Tubarão), ficam em
 * `BAIRROS_AMBIGUOS_LAGUNA` e valem apenas como sinal MÉDIO: nunca decidem
 * "local" sozinhos.
 */

/** Município alvo. */
export const MUNICIPIO = "Laguna";

/**
 * Bairros de Laguna com nome distintivo (sinal FORTE).
 * Fonte: laguna.sc.gov.br/pagina-23205 (Bairros — Região da Ilha e Central).
 */
export const BAIRROS_LAGUNA: string[] = [
  // Região da Ilha
  "Canto da Lagoa",
  "Campo Verde",
  "Cigana",
  "Farol de Santa Marta",
  "Galheta",
  "Ipuã",
  "Ponta da Barra",
  "Tereza",
  // Região Central
  "Cabeçuda",
  "Cabeçudas",
  "Campo de Fora",
  "Magalhães",
  "Mar Grosso",
  "Mato Alto",
  "Morro da Glória",
  "Ponta das Pedras",
  "Portinho", // "pavimentação de cinco ruas no bairro Portinho"
];

/**
 * Bairros/locais oficiais de Laguna cujo nome também ocorre em outros
 * municípios. Sinal MÉDIO — exigem corroboração para virar "local".
 */
export const BAIRROS_AMBIGUOS_LAGUNA: string[] = [
  "Barbacena",
  "Centro Histórico",
  "Esperança",
  "Industrial",
  "Jardim América",
  "Jardim Juliana",
  "Laguna Internacional",
  "Navegantes",
  "Passagem da Barra",
  "Progresso",
  "Estreito",
  "Madre",
];

/**
 * Distritos/comunidades de Laguna (sinal FORTE).
 * Fonte: páginas oficiais de ESFs e Transporte Escolar Municipal.
 */
export const DISTRITOS_LAGUNA: string[] = [
  "Barranceira",
  "Caputera",
  "Perrixil",
  "Bananal",
  "Ribeirão Pequeno",
];

/**
 * Pontos de referência exclusivos de Laguna (sinal FORTE contextual).
 * Não bastam por si só quando o texto indica fato compartilhado/regional
 * (ver `PADROES_COMPARTILHADOS` em lagunaScope.ts).
 */
export const PONTOS_REFERENCIA_LAGUNA: string[] = [
  "Ponte Anita Garibaldi",
  "Molhes da Barra",
  "Praia do Mar Grosso",
  "Casa de Anita Garibaldi",
];

/** Entidades/locais muito específicos e exclusivos de Laguna. */
export const ENTIDADES_LAGUNA: string[] = [
  "Prefeitura de Laguna",
  "Centro Administrativo Tordesilhas",
  "Centro Histórico de Laguna",
  "Cine Mussi",
  "Hospital Bom Jesus dos Passos",
  "Junta de Serviço Militar de Laguna",
  "Departamento Municipal de Esportes de Laguna",
];

/**
 * Regiões (NÃO são municípios e NÃO são bairros de Laguna).
 * Presença isolada nunca gera "local" nem "outside" — no máximo "uncertain".
 */
export const REGIOES: string[] = [
  "Amurel",
  "Planalto Norte",
  "Litoral",
  "Sul de SC",
  "Sul do Estado",
  "Região Sul",
];

/**
 * Nomes plausíveis de Laguna, porém sem confirmação oficial localizada.
 * Mantidos apenas para revisão manual futura — o motor os ignora.
 */
export const ALIASES_PARA_REVISAO: string[] = [
  "Parobé",
  "Figueira",
  "Itapirubá",
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
  "Mafra",
  "Pescaria Brava",
  "Braço do Norte", // comprovado: sulagora.com.br notícias 25565 e 25567
];

/** Locais externos específicos comprovados (não municípios). */
export const LOCAIS_EXTERNOS: string[] = ["Praia da Pinheira"];

/**
 * Substantivos que introduzem um LOGRADOURO. O nome que vem depois deles é
 * parte do endereço, não uma localidade autônoma.
 * Ex.: "Rua Visconde de Barbacena" → "Barbacena" NÃO é bairro de Laguna aqui.
 */
export const PALAVRAS_LOGRADOURO: string[] = [
  "rua",
  "avenida",
  "av",
  "rodovia",
  "estrada",
  "alameda",
  "travessa",
  "praca",
  "largo",
  "beco",
  "servidao",
  "viela",
  "marginal",
];

/**
 * Substantivos que introduzem uma ENTIDADE COMPOSTA (empresa, obra, órgão).
 * O nome próprio seguinte pertence à entidade, não ao território.
 * Ex.: "Ferrovia Tereza Cristina" → "Tereza" NÃO é bairro de Laguna aqui.
 * Regra geral e editável — evita lista infinita de exceções.
 */
export const PALAVRAS_ENTIDADE_COMPOSTA: string[] = [
  "ferrovia",
  "ferroviaria",
  "empresa",
  "grupo",
  "companhia",
  "industria",
  "transportadora",
  "construtora",
  "cooperativa",
  "sociedade",
  "sindicato",
  "associacao",
  "fundacao",
  "instituto",
  "universidade",
  "faculdade",
  "colegio",
  "banco",
  "supermercado",
  "mercado",
  "clube",
  "igreja",
  "capela",
  "emissora",
  "condominio",
  "edificio",
  "residencial",
  "loteamento",
];

