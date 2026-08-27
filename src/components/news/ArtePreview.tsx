import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ArtePreview({ textoArte }: { textoArte: string }) {
  return (
    <Card className="max-w-sm mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Preview da arte</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-square w-full rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-8">
          <p className="whitespace-pre-line text-center font-display text-xl font-bold leading-tight text-white">
            {textoArte}
          </p>
        </div>
        <p className="mt-3 text-xs text-muted-foreground text-center">
          Simulação visual — a arte final será gerada com o template escolhido.
        </p>
      </CardContent>
    </Card>
  );
}
