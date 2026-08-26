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

export type NewsStatus =
  | "nova"
  | "aguardando_aprovacao"
  | "aprovada"
  | "rejeitada"
  | "publicada"
  | "duplicada";

export type PublicationStatus = "rascunho" | "agendada" | "publicada" | "erro";

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
