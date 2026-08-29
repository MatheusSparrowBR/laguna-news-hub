export const CATEGORIAS = [
  "Urgente",
  "Trânsito",
  "Segurança",
  "Prefeitura",
  "Cidade",
  "Eventos",
  "Turismo",
  "Clima",
  "Esportes",
  "Economia",
  "Educação",
  "Saúde",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const IMPORTANCIAS = ["baixa", "media", "alta", "urgente"] as const;

export type Importancia = (typeof IMPORTANCIAS)[number];

export const NEWS_STATUS = [
  "nova",
  "em_analise",
  "aguardando_aprovacao",
  "aprovada",
  "publicada",
  "ignorada",
  "duplicada",
  "revisao_obrigatoria",
  "rejeitada",
] as const;

export type NewsStatus = (typeof NEWS_STATUS)[number];

/** Conteúdo preparado (hoje simulado) para a publicação no Instagram. */
export interface ConteudoGerado {
  titulo: string;
  resumo: string;
  legenda: string;
  hashtags: string;
  textoArte: string;
}

export interface NewsItem {
  id: string;
  titulo: string;
  fonte: string;
  url: string;
  horario: string;
  categoria: Categoria;
  importancia: Importancia;
  status: NewsStatus;
  resumo: string;
  conteudo: string;
  cidade: string;
  estado: string;
  importanciaNota: number;
  confiancaIA: number;
  duplicada: boolean;
  duplicadaDe?: string;
  sugestaoTitulo?: string;
  sugestaoLegenda?: string;
  grupoDuplicidade?: string;
  explicacaoIA: string;
  gerado: ConteudoGerado;
  isDemo?: boolean;
}

export type PublicationStatus = "rascunho" | "agendada" | "publicada" | "erro";

export interface Publication {
  id: string;
  newsId: string;
  titulo: string;
  categoria: Categoria;
  legenda: string;
  status: PublicationStatus;
  horario: string;
  visualizacoes: number;
  curtidas: number;
  comentarios: number;
  template: string;
}

export interface Source {
  id: string;
  nome: string;
  url: string;
  tipo: "site" | "rss" | "api" | "official";
  rssUrl?: string | null;
  ativa: boolean;
  ultimaColeta: string;
  noticiasColetadas: number;
}

export interface DailyMetric {
  dia: string;
  publicacoes: number;
  alcance: number;
}
