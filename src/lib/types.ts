export type Categoria =
  | "Urgente"
  | "Trânsito"
  | "Segurança"
  | "Prefeitura"
  | "Cidade"
  | "Eventos"
  | "Turismo"
  | "Clima"
  | "Esportes"
  | "Economia"
  | "Educação"
  | "Saúde";

export const CATEGORIAS: Categoria[] = [
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
];

export type Importancia = "baixa" | "media" | "alta" | "urgente";

export const IMPORTANCIAS: Importancia[] = ["urgente", "alta", "media", "baixa"];

export type NewsStatus =
  | "nova"
  | "em_analise"
  | "aguardando_aprovacao"
  | "aprovada"
  | "publicada"
  | "ignorada"
  | "rejeitada"
  | "duplicada"
  | "revisao_obrigatoria";

export const NEWS_STATUS: NewsStatus[] = [
  "nova",
  "em_analise",
  "aguardando_aprovacao",
  "aprovada",
  "publicada",
  "ignorada",
  "rejeitada",
  "duplicada",
  "revisao_obrigatoria",
];

export type PublicationStatus = "rascunho" | "agendada" | "publicada" | "erro";

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
  horario: string; // ISO
  categoria: Categoria;
  importancia: Importancia;
  status: NewsStatus;
  resumo: string;
  conteudo: string;
  duplicadaDe?: string;
  sugestaoLegenda?: string;
  sugestaoTitulo?: string;
  // Análise simulada da IA
  cidade: string;
  estado: string;
  importanciaNota: number; // 0 a 10
  confiancaIA: number; // 0 a 100
  duplicada: boolean;
  grupoDuplicidade?: string;
  explicacaoIA: string;
  gerado: ConteudoGerado;
  // Campo para diferenciar demo de real
  isDemo?: boolean;
}

export interface Publication {
  id: string;
  newsId: string;
  titulo: string;
  categoria: Categoria;
  legenda: string;
  status: PublicationStatus;
  horario: string; // ISO
  visualizacoes: number;
  curtidas: number;
  comentarios: number;
  template: string;
}

export interface Source {
  id: string;
  nome: string;
  url: string;
  tipo: "site" | "rss" | "rede_social";
  ativa: boolean;
  ultimaColeta: string;
  noticiasColetadas: number;
}

export interface DailyMetric {
  dia: string;
  publicacoes: number;
  alcance: number;
}

export type PeriodoFiltro = "todos" | "hoje" | "24h" | "7dias" | "personalizado";
