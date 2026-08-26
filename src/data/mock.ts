import type {
  DailyMetric,
  NewsItem,
  Publication,
  Source,
} from "@/lib/types";

/**
 * Dados simulados. Futuramente serão substituídos por consultas ao Supabase
 * (ver src/services/*).
 */

const hoje = new Date();

function hora(h: number, m = 0, diasAtras = 0): string {
  const d = new Date(hoje);
  d.setDate(d.getDate() - diasAtras);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

/** Notícia como ela chega das fontes, antes da análise simulada da IA. */
type NoticiaBruta = Omit<
  NewsItem,
  | "cidade"
  | "estado"
  | "importanciaNota"
  | "confiancaIA"
  | "duplicada"
  | "grupoDuplicidade"
  | "explicacaoIA"
  | "gerado"
>;

const noticiasBrutas: NoticiaBruta[] = [
  {
    id: "n1",
    titulo: "Acidente causa lentidão em trecho da BR-101 em Laguna",
    fonte: "Rádio Laguna",
    url: "https://exemplo.com/br101-lentidao",
    horario: hora(7, 42),
    categoria: "Trânsito",
    importancia: "urgente",
    status: "aguardando_aprovacao",
    resumo:
      "Colisão entre dois veículos no km 320 da BR-101, sentido sul, deixa o trânsito lento na manhã desta quarta-feira.",
    conteudo:
      "Uma colisão entre dois veículos de passeio foi registrada no km 320 da BR-101, em Laguna, no início da manhã. Segundo a concessionária, uma faixa foi bloqueada para atendimento e o trânsito segue lento no sentido sul. Não houve vítimas graves. Equipes trabalham na remoção dos veículos.",
    sugestaoTitulo: "BR-101: acidente deixa trânsito lento em Laguna",
    sugestaoLegenda:
      "🚨 TRÂNSITO | Acidente no km 320 da BR-101, em Laguna, deixa o trânsito lento no sentido sul nesta manhã. Uma faixa está bloqueada para atendimento. Redobre a atenção ao passar pelo trecho.",
  },
  {
    id: "n2",
    titulo: "Prefeitura de Laguna anuncia nova ação de revitalização urbana",
    fonte: "Portal Notícias do Sul",
    url: "https://exemplo.com/prefeitura-revitalizacao",
    horario: hora(9, 15),
    categoria: "Prefeitura",
    importancia: "media",
    status: "em_analise",
    resumo:
      "Ação prevê recuperação de calçadas e nova iluminação em ruas do centro de Laguna, com início previsto para o próximo mês.",
    conteudo:
      "A Prefeitura de Laguna anunciou uma nova ação de revitalização urbana que contempla a recuperação de calçadas, troca de iluminação pública e paisagismo em ruas do centro. Segundo a administração, os trabalhos começam no próximo mês e devem durar cerca de 90 dias.",
    sugestaoTitulo: "Centro de Laguna terá calçadas e iluminação renovadas",
    sugestaoLegenda:
      "🏛️ PREFEITURA | Laguna anuncia revitalização no centro: calçadas recuperadas, nova iluminação e paisagismo. Início previsto para o próximo mês.",
  },
  {
    id: "n3",
    titulo: "Evento movimenta o centro histórico de Laguna neste fim de semana",
    fonte: "Diário Laguna",
    url: "https://exemplo.com/centro-historico-evento",
    horario: hora(10, 5),
    categoria: "Eventos",
    importancia: "media",
    status: "aprovada",
    resumo:
      "Feira cultural com música, artesanato e gastronomia ocupa a Praça República Juliana entre sexta e domingo.",
    conteudo:
      "O centro histórico de Laguna recebe neste fim de semana uma feira cultural com apresentações musicais, artesanato local e praça de alimentação. A programação acontece na Praça República Juliana, das 10h às 22h, com entrada gratuita.",
    sugestaoTitulo: "Feira cultural agita o centro histórico de Laguna",
    sugestaoLegenda:
      "🎉 EVENTOS | Música, artesanato e gastronomia no centro histórico de Laguna neste fim de semana. Entrada gratuita, das 10h às 22h.",
  },
  {
    id: "n4",
    titulo: "Defesa Civil emite alerta de ventos fortes para a região de Laguna",
    fonte: "Defesa Civil SC",
    url: "https://exemplo.com/alerta-ventos",
    horario: hora(6, 30),
    categoria: "Clima",
    importancia: "urgente",
    status: "publicada",
    resumo:
      "Alerta válido até a noite desta quarta prevê rajadas de até 70 km/h no litoral sul catarinense.",
    conteudo:
      "A Defesa Civil de Santa Catarina emitiu alerta de ventos fortes para o litoral sul, incluindo Laguna. A previsão indica rajadas de até 70 km/h até a noite desta quarta-feira. A recomendação é evitar áreas de praia e não se abrigar sob árvores.",
    sugestaoTitulo: "Alerta: ventos de até 70 km/h em Laguna",
    sugestaoLegenda:
      "⚠️ ALERTA | Defesa Civil prevê rajadas de até 70 km/h em Laguna e região até a noite. Evite praias e não se abrigue sob árvores.",
  },
  {
    id: "n5",
    titulo: "Alteração no trânsito na região do Mercado Público de Laguna",
    fonte: "Prefeitura de Laguna",
    url: "https://exemplo.com/alteracao-transito",
    horario: hora(11, 20),
    categoria: "Trânsito",
    importancia: "alta",
    status: "aguardando_aprovacao",
    resumo:
      "Rua lateral ao Mercado Público terá sentido único a partir de segunda-feira, segundo a Secretaria de Mobilidade.",
    conteudo:
      "A Secretaria de Mobilidade informou que a rua lateral ao Mercado Público passará a ter sentido único a partir de segunda-feira. A mudança busca melhorar o fluxo de veículos e ampliar o espaço para pedestres na região.",
  },
  {
    id: "n6",
    titulo: "Praia do Mar Grosso recebe ação de limpeza com voluntários",
    fonte: "Diário Laguna",
    url: "https://exemplo.com/limpeza-mar-grosso",
    horario: hora(14, 10, 1),
    categoria: "Cidade",
    importancia: "baixa",
    status: "publicada",
    resumo:
      "Mutirão reuniu moradores e recolheu cerca de 300 kg de resíduos na orla.",
    conteudo:
      "Um mutirão de limpeza reuniu voluntários na Praia do Mar Grosso, em Laguna. A ação recolheu cerca de 300 kg de resíduos e teve apoio de escolas da região.",
  },
  {
    id: "n7",
    titulo: "Turismo em Laguna cresce com procura por roteiros históricos",
    fonte: "Portal Notícias do Sul",
    url: "https://exemplo.com/turismo-laguna",
    horario: hora(16, 45, 1),
    categoria: "Turismo",
    importancia: "baixa",
    status: "ignorada",
    resumo:
      "Guias locais relatam aumento na procura por visitas ao centro histórico e à Casa de Anita.",
    conteudo:
      "Operadores de turismo de Laguna registram aumento na procura por roteiros históricos, especialmente visitas guiadas ao centro histórico e à Casa de Anita Garibaldi.",
  },
  {
    id: "n8",
    titulo: "Acidente na BR-101 deixa trânsito lento próximo a Laguna",
    fonte: "Blog do Litoral",
    url: "https://exemplo.com/br101-duplicada",
    horario: hora(8, 5),
    categoria: "Trânsito",
    importancia: "alta",
    status: "duplicada",
    duplicadaDe: "n1",
    resumo:
      "Registro semelhante ao acidente já identificado no km 320 da BR-101.",
    conteudo:
      "Motoristas relatam lentidão na BR-101 na altura de Laguna após colisão entre dois carros. O trecho é o mesmo já reportado por outra fonte.",
  },
  {
    id: "n9",
    titulo: "Posto de saúde do bairro Magalhães amplia horário de atendimento",
    fonte: "Prefeitura de Laguna",
    url: "https://exemplo.com/saude-magalhaes",
    horario: hora(13, 0),
    categoria: "Saúde",
    importancia: "media",
    status: "revisao_obrigatoria",
    resumo:
      "Unidade passa a atender até as 20h de segunda a sexta a partir da próxima semana.",
    conteudo:
      "A unidade de saúde do bairro Magalhães, em Laguna, passará a funcionar até as 20h de segunda a sexta. A ampliação atende pedido de moradores e começa na próxima semana.",
  },
  {
    id: "n10",
    titulo: "Escolas municipais de Laguna abrem matrículas para novo semestre",
    fonte: "Rádio Laguna",
    url: "https://exemplo.com/matriculas",
    horario: hora(15, 30, 2),
    categoria: "Educação",
    importancia: "media",
    status: "publicada",
    resumo:
      "Período de matrículas segue por duas semanas nas secretarias das escolas.",
    conteudo:
      "As escolas da rede municipal de Laguna abriram o período de matrículas para o novo semestre. O atendimento acontece nas secretarias das unidades, das 8h às 17h.",
  },
];

/**
 * Análise e conteúdo simulados da IA para cada notícia.
 * Futuramente estes campos virão do Supabase / do serviço de IA.
 */
type AnaliseSimulada = Pick<
  NewsItem,
  | "importanciaNota"
  | "confiancaIA"
  | "duplicada"
  | "explicacaoIA"
  | "gerado"
> & { grupoDuplicidade?: string };

const analiseSimulada: Record<string, AnaliseSimulada> = {
  n1: {
    importanciaNota: 9,
    confiancaIA: 96,
    duplicada: false,
    grupoDuplicidade: "dup-br101-km320",
    explicacaoIA:
      "Classificada como urgente porque envolve acidente com bloqueio de faixa em rodovia federal que corta a cidade, com impacto imediato no deslocamento dos moradores.",
    gerado: {
      titulo: "BR-101: acidente deixa trânsito lento em Laguna",
      resumo:
        "Colisão no km 320 da BR-101, sentido sul, bloqueou uma faixa e deixou o trânsito lento na manhã desta quarta.",
      legenda:
        "🚨 TRÂNSITO | Acidente no km 320 da BR-101, em Laguna, deixa o trânsito lento no sentido sul nesta manhã. Uma faixa está bloqueada para atendimento. Redobre a atenção ao passar pelo trecho.",
      hashtags: "#laguna #br101 #transito #lagunasc #noticiaslaguna",
      textoArte: "ACIDENTE NA BR-101\nTrânsito lento em Laguna",
    },
  },
  n2: {
    importanciaNota: 6,
    confiancaIA: 91,
    duplicada: false,
    explicacaoIA:
      "Importância média: é um anúncio oficial da Prefeitura com impacto no centro da cidade, mas sem urgência imediata para o dia de hoje.",
    gerado: {
      titulo: "Centro de Laguna terá calçadas e iluminação renovadas",
      resumo:
        "Prefeitura anuncia revitalização no centro com novas calçadas, iluminação e paisagismo a partir do próximo mês.",
      legenda:
        "🏛️ PREFEITURA | Laguna anuncia revitalização no centro: calçadas recuperadas, nova iluminação e paisagismo. Início previsto para o próximo mês.",
      hashtags: "#laguna #prefeituradelaguna #centrohistorico #lagunasc",
      textoArte: "REVITALIZAÇÃO NO CENTRO\nCalçadas e nova iluminação",
    },
  },
  n3: {
    importanciaNota: 5,
    confiancaIA: 88,
    duplicada: false,
    explicacaoIA:
      "Importância média porque é um evento cultural com data definida no centro histórico, de interesse geral, mas sem caráter de alerta.",
    gerado: {
      titulo: "Feira cultural agita o centro histórico de Laguna",
      resumo:
        "Feira com música, artesanato e gastronomia ocupa a Praça República Juliana de sexta a domingo, das 10h às 22h.",
      legenda:
        "🎉 EVENTOS | Música, artesanato e gastronomia no centro histórico de Laguna neste fim de semana. Entrada gratuita, das 10h às 22h.",
      hashtags: "#laguna #eventoslaguna #centrohistorico #culturasc",
      textoArte: "FEIRA CULTURAL\nCentro histórico de Laguna",
    },
  },
  n4: {
    importanciaNota: 10,
    confiancaIA: 98,
    duplicada: false,
    explicacaoIA:
      "Classificada como urgente porque é um alerta oficial da Defesa Civil com risco à segurança da população e validade para hoje.",
    gerado: {
      titulo: "Alerta: ventos de até 70 km/h em Laguna",
      resumo:
        "Defesa Civil alerta para rajadas de até 70 km/h no litoral sul, incluindo Laguna, até a noite desta quarta.",
      legenda:
        "⚠️ ALERTA | Defesa Civil prevê rajadas de até 70 km/h em Laguna e região até a noite. Evite praias e não se abrigue sob árvores.",
      hashtags: "#laguna #defesacivil #alerta #clima #lagunasc",
      textoArte: "ALERTA DE VENTOS FORTES\nRajadas de até 70 km/h",
    },
  },
  n5: {
    importanciaNota: 8,
    confiancaIA: 94,
    duplicada: false,
    explicacaoIA:
      "A notícia foi classificada como alta importância porque informa uma alteração no trânsito em uma via central da cidade, afetando a rotina de quem circula pela região.",
    gerado: {
      titulo: "Rua do Mercado Público terá sentido único em Laguna",
      resumo:
        "Rua lateral ao Mercado Público passa a ter sentido único a partir de segunda-feira, segundo a Secretaria de Mobilidade.",
      legenda:
        "🚦 TRÂNSITO | Atenção, Laguna: a rua lateral ao Mercado Público passa a ter sentido único a partir de segunda-feira. A mudança busca melhorar o fluxo e ampliar o espaço para pedestres.",
      hashtags: "#laguna #transito #mercadopublico #lagunasc",
      textoArte: "MUDANÇA NO TRÂNSITO\nRua do Mercado Público",
    },
  },
  n6: {
    importanciaNota: 3,
    confiancaIA: 82,
    duplicada: false,
    explicacaoIA:
      "Importância baixa: é uma ação comunitária positiva já encerrada, sem impacto direto na rotina ou na segurança dos moradores.",
    gerado: {
      titulo: "Mutirão recolhe 300 kg de resíduos no Mar Grosso",
      resumo:
        "Voluntários recolheram cerca de 300 kg de resíduos na orla da Praia do Mar Grosso, com apoio de escolas.",
      legenda:
        "🌊 CIDADE | Mutirão na Praia do Mar Grosso recolheu cerca de 300 kg de resíduos. Parabéns aos voluntários e às escolas que participaram!",
      hashtags: "#laguna #margrosso #meioambiente #lagunasc",
      textoArte: "MUTIRÃO DE LIMPEZA\n300 kg recolhidos no Mar Grosso",
    },
  },
  n7: {
    importanciaNota: 2,
    confiancaIA: 71,
    duplicada: false,
    explicacaoIA:
      "Importância baixa e confiança reduzida: o texto traz percepções de guias locais, sem dados oficiais que confirmem o crescimento citado.",
    gerado: {
      titulo: "Roteiros históricos crescem em Laguna",
      resumo:
        "Guias locais relatam aumento na procura por visitas ao centro histórico e à Casa de Anita Garibaldi.",
      legenda:
        "🏛️ TURISMO | Guias de Laguna relatam mais procura por roteiros históricos, com destaque para o centro histórico e a Casa de Anita.",
      hashtags: "#laguna #turismo #anitagaribaldi #lagunasc",
      textoArte: "TURISMO HISTÓRICO\nProcura em alta em Laguna",
    },
  },
  n8: {
    importanciaNota: 8,
    confiancaIA: 65,
    duplicada: true,
    grupoDuplicidade: "dup-br101-km320",
    explicacaoIA:
      "Marcada como duplicada: descreve o mesmo acidente no km 320 da BR-101 já publicado por outra fonte, com poucas informações novas.",
    gerado: {
      titulo: "BR-101 com trânsito lento perto de Laguna",
      resumo: "Motoristas relatam lentidão na BR-101 após colisão entre dois carros.",
      legenda:
        "🚧 TRÂNSITO | Lentidão na BR-101 na altura de Laguna após colisão entre dois veículos.",
      hashtags: "#laguna #br101 #transito",
      textoArte: "BR-101\nTrânsito lento",
    },
  },
  n9: {
    importanciaNota: 6,
    confiancaIA: 58,
    duplicada: false,
    explicacaoIA:
      "Marcada para revisão obrigatória: a confiança ficou baixa porque a data de início da ampliação não está clara no texto original.",
    gerado: {
      titulo: "Posto de saúde do Magalhães amplia horário",
      resumo:
        "Unidade do bairro Magalhães passa a atender até as 20h de segunda a sexta a partir da próxima semana.",
      legenda:
        "🏥 SAÚDE | O posto de saúde do bairro Magalhães, em Laguna, passa a atender até as 20h de segunda a sexta.",
      hashtags: "#laguna #saude #magalhaes #lagunasc",
      textoArte: "POSTO DE SAÚDE\nAtendimento até as 20h",
    },
  },
  n10: {
    importanciaNota: 6,
    confiancaIA: 90,
    duplicada: false,
    explicacaoIA:
      "Importância média: informação de serviço com prazo definido, útil para famílias da rede municipal de ensino.",
    gerado: {
      titulo: "Matrículas abertas na rede municipal de Laguna",
      resumo:
        "Escolas municipais recebem matrículas para o novo semestre por duas semanas, das 8h às 17h.",
      legenda:
        "🎓 EDUCAÇÃO | Matrículas abertas nas escolas municipais de Laguna por duas semanas, das 8h às 17h nas secretarias.",
      hashtags: "#laguna #educacao #matriculas #lagunasc",
      textoArte: "MATRÍCULAS ABERTAS\nRede municipal de Laguna",
    },
  },
};

export const mockNews: NewsItem[] = noticiasBrutas.map((n) => {
  const analise = analiseSimulada[n.id]!;
  return {
    ...n,
    cidade: "Laguna",
    estado: "SC",
    ...analise,
  };
});

export const mockPublications: Publication[] = [
  {
    id: "p1",
    newsId: "n4",
    titulo: "Alerta: ventos de até 70 km/h em Laguna",
    categoria: "Clima",
    legenda:
      "⚠️ ALERTA | Defesa Civil prevê rajadas de até 70 km/h em Laguna e região até a noite.",
    status: "publicada",
    horario: hora(7, 0),
    visualizacoes: 8420,
    curtidas: 612,
    comentarios: 48,
    template: "Alerta vermelho",
  },
  {
    id: "p2",
    newsId: "n3",
    titulo: "Feira cultural agita o centro histórico de Laguna",
    categoria: "Eventos",
    legenda:
      "🎉 EVENTOS | Música, artesanato e gastronomia no centro histórico neste fim de semana.",
    status: "agendada",
    horario: hora(18, 30),
    visualizacoes: 0,
    curtidas: 0,
    comentarios: 0,
    template: "Padrão azul",
  },
  {
    id: "p3",
    newsId: "n6",
    titulo: "Mutirão recolhe 300 kg de resíduos no Mar Grosso",
    categoria: "Cidade",
    legenda: "🌊 CIDADE | Voluntários recolheram cerca de 300 kg de resíduos na orla.",
    status: "publicada",
    horario: hora(12, 15),
    visualizacoes: 5210,
    curtidas: 388,
    comentarios: 21,
    template: "Padrão azul",
  },
  {
    id: "p4",
    newsId: "n2",
    titulo: "Centro de Laguna terá calçadas e iluminação renovadas",
    categoria: "Prefeitura",
    legenda: "🏛️ PREFEITURA | Revitalização no centro começa no próximo mês.",
    status: "rascunho",
    horario: hora(20, 0),
    visualizacoes: 0,
    curtidas: 0,
    comentarios: 0,
    template: "Padrão azul",
  },
  {
    id: "p5",
    newsId: "n10",
    titulo: "Matrículas abertas na rede municipal de Laguna",
    categoria: "Educação",
    legenda: "🎓 EDUCAÇÃO | Matrículas abertas por duas semanas.",
    status: "erro",
    horario: hora(9, 45, 1),
    visualizacoes: 0,
    curtidas: 0,
    comentarios: 0,
    template: "Padrão azul",
  },
];

export const mockSources: Source[] = [
  {
    id: "s1",
    nome: "Diário Laguna",
    url: "https://exemplo.com/diariolaguna",
    tipo: "site",
    ativa: true,
    ultimaColeta: hora(11, 30),
    noticiasColetadas: 128,
  },
  {
    id: "s2",
    nome: "Prefeitura de Laguna",
    url: "https://exemplo.com/laguna/noticias",
    tipo: "site",
    ativa: true,
    ultimaColeta: hora(11, 30),
    noticiasColetadas: 96,
  },
  {
    id: "s3",
    nome: "Rádio Laguna",
    url: "https://exemplo.com/radiolaguna/rss",
    tipo: "rss",
    ativa: true,
    ultimaColeta: hora(10, 55),
    noticiasColetadas: 74,
  },
  {
    id: "s4",
    nome: "Defesa Civil SC",
    url: "https://exemplo.com/defesacivil/rss",
    tipo: "rss",
    ativa: true,
    ultimaColeta: hora(9, 20),
    noticiasColetadas: 43,
  },
  {
    id: "s5",
    nome: "Portal Notícias do Sul",
    url: "https://exemplo.com/noticiasdosul",
    tipo: "site",
    ativa: false,
    ultimaColeta: hora(17, 0, 3),
    noticiasColetadas: 61,
  },
  {
    id: "s6",
    nome: "Blog do Litoral",
    url: "https://exemplo.com/blogdolitoral",
    tipo: "rede_social",
    ativa: false,
    ultimaColeta: hora(8, 5, 5),
    noticiasColetadas: 12,
  },
];

export const mockDailyMetrics: DailyMetric[] = [
  { dia: "Qui", publicacoes: 4, alcance: 9200 },
  { dia: "Sex", publicacoes: 6, alcance: 14300 },
  { dia: "Sáb", publicacoes: 3, alcance: 8100 },
  { dia: "Dom", publicacoes: 2, alcance: 6400 },
  { dia: "Seg", publicacoes: 5, alcance: 12800 },
  { dia: "Ter", publicacoes: 7, alcance: 17600 },
  { dia: "Qua", publicacoes: 5, alcance: 15900 },
];

export const mockInstagramStats = {
  seguidores: 12480,
  crescimentoSemana: 3.8,
  alcanceHoje: 15900,
  alcance7dias: 84300,
  engajamentoMedio: 6.2,
  contaConectada: false,
};
