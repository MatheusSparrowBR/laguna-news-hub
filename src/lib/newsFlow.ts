import type { NewsItem, NewsStatus } from "./types";

export interface EtapaHistorico {
  titulo: string;
  descricao: string;
  horario: string; // ISO
  concluida: boolean;
}

/** Ordem do fluxo editorial usada na timeline. */
const ordem: NewsStatus[] = [
  "nova",
  "em_analise",
  "aguardando_aprovacao",
  "aprovada",
  "publicada",
];

function somarMinutos(iso: string, minutos: number): string {
  return new Date(new Date(iso).getTime() + minutos * 60000).toISOString();
}

/**
 * Monta a timeline simulada da notícia a partir do status atual.
 * Os horários são derivados do horário de coleta.
 */
export function montarHistorico(noticia: NewsItem): EtapaHistorico[] {
  const indiceAtual = ordem.indexOf(noticia.status);
  const encerrada =
    noticia.status === "ignorada" ||
    noticia.status === "rejeitada" ||
    noticia.status === "duplicada" ||
    noticia.status === "revisao_obrigatoria";

  const etapas: EtapaHistorico[] = [
    {
      titulo: "Notícia encontrada",
      descricao: `Coletada da fonte ${noticia.fonte}`,
      horario: noticia.horario,
      concluida: true,
    },
    {
      titulo: "Analisada pela IA",
      descricao: `Categoria ${noticia.categoria} · confiança ${noticia.confiancaIA}%`,
      horario: somarMinutos(noticia.horario, 3),
      concluida: encerrada || indiceAtual >= 1,
    },
    {
      titulo: "Conteúdo gerado",
      descricao: "Título, resumo, legenda e hashtags preparados",
      horario: somarMinutos(noticia.horario, 6),
      concluida: encerrada || indiceAtual >= 2,
    },
    {
      titulo: "Aguardando aprovação",
      descricao: "Enviada para revisão do administrador",
      horario: somarMinutos(noticia.horario, 8),
      concluida: indiceAtual >= 2,
    },
    {
      titulo: "Aprovada",
      descricao: "Liberada para a fila de publicações",
      horario: somarMinutos(noticia.horario, 25),
      concluida: indiceAtual >= 3,
    },
    {
      titulo: "Publicada",
      descricao: "Publicação enviada ao Instagram (simulado)",
      horario: somarMinutos(noticia.horario, 40),
      concluida: indiceAtual >= 4,
    },
  ];

  if (encerrada) {
    etapas.push({
      titulo:
        noticia.status === "duplicada"
          ? "Marcada como duplicada"
          : noticia.status === "revisao_obrigatoria"
            ? "Revisão obrigatória"
            : noticia.status === "ignorada"
              ? "Notícia ignorada"
              : "Notícia rejeitada",
      descricao: "Fluxo interrompido nesta etapa",
      horario: somarMinutos(noticia.horario, 12),
      concluida: true,
    });
  }

  return etapas;
}
