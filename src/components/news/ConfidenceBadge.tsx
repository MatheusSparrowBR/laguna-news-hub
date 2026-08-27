import { Badge } from "@/components/ui/badge";

export function ConfidenceBadge({ confianca }: { confianca: number }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let label = `${confianca}% confiança`;

  if (confianca >= 85) {
    variant = "default";
  } else if (confianca >= 65) {
    variant = "secondary";
  } else {
    variant = "destructive";
  }

  return <Badge variant={variant}>{label}</Badge>;
}
