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
    status: "aguardando_aprovacao",
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
    status: "nova",
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
    status: "rejeitada",
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
    status: "nova",
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
