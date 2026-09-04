import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DecisaoGeo } from "@/services/editorialData";

const ROTULOS: Record<DecisaoGeo, string> = {
  local: "🟢 Laguna",
  uncertain: "🟡 Incerta",
  outside: "🔴 Fora",
};

const CLASSES: Record<DecisaoGeo, string> = {
  local: "border-primary/40 bg-primary/10 text-primary",
  uncertain: "border-warning/40 bg-warning/10 text-warning-foreground",
  outside: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function GeoBadge({
  decisao,
  manual,
  className,
}: {
  decisao: DecisaoGeo | null;
  manual?: boolean;
  className?: string;
}) {
  if (!decisao) {
    return (
      <Badge variant="outline" className={cn("text-muted-foreground", className)}>
        Sem análise
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn(CLASSES[decisao], className)}>
      {ROTULOS[decisao]}
      {manual ? " · revisada" : ""}
    </Badge>
  );
}

export function rotuloGeo(decisao: DecisaoGeo): string {
  return ROTULOS[decisao];
}
