import { Loader2 } from "lucide-react";

export function LoadingState({ mensagem = "Carregando..." }: { mensagem?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="mt-3 text-sm text-muted-foreground">{mensagem}</p>
    </div>
  );
}
