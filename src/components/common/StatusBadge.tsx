import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  nova: { label: "Nova", variant: "outline" },
  em_analise: { label: "Em análise", variant: "secondary" },
  aguardando_aprovacao: { label: "Aguardando aprovação", variant: "default" },
  aprovada: { label: "Aprovada", variant: "default" },
  publicada: { label: "Publicada", variant: "default" },
  ignorada: { label: "Ignorada", variant: "secondary" },
  rejeitada: { label: "Rejeitada", variant: "destructive" },
  duplicada: { label: "Duplicada", variant: "secondary" },
  revisao_obrigatoria: { label: "Revisão obrigatória", variant: "destructive" },
  rascunho: { label: "Rascunho", variant: "outline" },
  agendada: { label: "Agendada", variant: "secondary" },
  erro: { label: "Erro", variant: "destructive" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
