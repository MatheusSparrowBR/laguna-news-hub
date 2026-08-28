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

export type Importancia = "baixa" | "media" | "alta" | "urgente";

export type NewsStatus =
  | "nova"
  | "em_analise"
  | "aguardando_aprovacao"
  | "aprovada"
  | "publicada"
  | "ignorada"
  | "duplicada"
  | "revisao_obrigatoria"
  | "rejeitada";

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
  grupoDuplicidade?: string;
  explicacaoIA: string;
  gerado: {
    titulo: string;
    resumo: string;
    legenda: string;
    hashtags: string;
    textoArte: string;
  };
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
  ativa: boolean;
  ultimaColeta: string;
  noticiasColetadas: number;
}

export interface DailyMetric {
  dia: string;
  publicacoes: number;
  alcance: number;
}
