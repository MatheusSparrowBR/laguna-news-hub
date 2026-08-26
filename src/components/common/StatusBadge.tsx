import { cn } from "@/lib/utils";
import type { Importancia, NewsStatus, PublicationStatus } from "@/lib/types";

const newsLabels: Record<NewsStatus, { label: string; className: string }> = {
  nova: { label: "Nova", className: "bg-secondary text-secondary-foreground border-border" },
  aguardando_aprovacao: {
    label: "Aguardando aprovação",
    className: "bg-warning-soft text-warning-foreground border-warning/30",
  },
  aprovada: { label: "Aprovada", className: "bg-success-soft text-success border-success/25" },
  rejeitada: { label: "Rejeitada", className: "bg-muted text-muted-foreground border-border" },
  publicada: { label: "Publicada", className: "bg-primary-soft text-primary border-primary/25" },
  duplicada: {
    label: "Duplicada",
    className: "bg-muted text-muted-foreground border-dashed border-border",
  },
  em_analise: {
    label: "Em análise",
    className: "bg-primary-soft text-primary border-primary/20",
  },
  ignorada: {
    label: "Ignorada",
    className: "bg-muted text-muted-foreground border-border",
  },
  revisao_obrigatoria: {
    label: "Revisão obrigatória",
    className: "bg-destructive-soft text-destructive border-destructive/25",
  },
};

const publicationLabels: Record<PublicationStatus, { label: string; className: string }> = {
  rascunho: { label: "Rascunho", className: "bg-secondary text-secondary-foreground border-border" },
  agendada: {
    label: "Agendada",
    className: "bg-warning-soft text-warning-foreground border-warning/30",
  },
  publicada: { label: "Publicada", className: "bg-success-soft text-success border-success/25" },
  erro: { label: "Erro", className: "bg-destructive-soft text-destructive border-destructive/25" },
};

const importanciaLabels: Record<Importancia, { label: string; className: string }> = {
  baixa: { label: "Baixa", className: "bg-secondary text-secondary-foreground border-border" },
  media: { label: "Média", className: "bg-primary-soft text-primary border-primary/20" },
  alta: { label: "Alta", className: "bg-warning-soft text-warning-foreground border-warning/30" },
  urgente: {
    label: "Urgente",
    className: "bg-destructive-soft text-destructive border-destructive/30",
  },
};

type Props =
  | { tipo: "noticia"; valor: NewsStatus; className?: string }
  | { tipo: "publicacao"; valor: PublicationStatus; className?: string }
  | { tipo: "importancia"; valor: Importancia; className?: string };

export function StatusBadge(props: Props) {
  const mapa =
    props.tipo === "noticia"
      ? newsLabels[props.valor]
      : props.tipo === "publicacao"
        ? publicationLabels[props.valor]
        : importanciaLabels[props.valor];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        mapa.className,
        props.className,
      )}
    >
      {props.tipo === "importancia" ? `Importância: ${mapa.label}` : mapa.label}
    </span>
  );
}
