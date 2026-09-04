import { Badge } from "@/components/ui/badge";

export function ConfidenceBadge({ confianca }: { confianca: number }) {
  const variant: "default" | "secondary" | "destructive" | "outline" =
    confianca >= 85 ? "default" : confianca >= 65 ? "secondary" : "destructive";
  const label = `${confianca}% confiança`;

  return <Badge variant={variant}>{label}</Badge>;
}
