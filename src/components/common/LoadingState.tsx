import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({
  linhas = 3,
  texto = "Carregando...",
}: {
  linhas?: number;
  texto?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <p className="text-sm text-muted-foreground">{texto}</p>
      <div className="mt-4 space-y-3">
        {Array.from({ length: linhas }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
