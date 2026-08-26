import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/** Campo de conteúdo gerado, com botão "Regenerar" (simulado). */
export function EditableField({
  rotulo,
  valor,
  onChange,
  onRegenerar,
  multilinha = false,
  linhas = 4,
  ajuda,
}: {
  rotulo: string;
  valor: string;
  onChange: (valor: string) => void;
  onRegenerar: () => void;
  multilinha?: boolean;
  linhas?: number;
  ajuda?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {rotulo}
        </label>
        <Button variant="ghost" size="sm" onClick={onRegenerar}>
          <RefreshCw className="size-3.5" />
          Regenerar
        </Button>
      </div>
      {multilinha ? (
        <Textarea
          className="mt-1.5"
          rows={linhas}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input className="mt-1.5" value={valor} onChange={(e) => onChange(e.target.value)} />
      )}
      {ajuda && <p className="mt-1.5 text-xs text-muted-foreground">{ajuda}</p>}
    </div>
  );
}
