import { Loader2 } from "lucide-react";

export function LoadingState({
  mensagem = "Carregando...",
  titulo,
}: {
  mensagem?: string;
  titulo?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="mt-3 text-sm text-muted-foreground">{titulo ?? mensagem}</p>
    </div>
  );
}
