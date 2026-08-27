import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface EditableFieldProps {
  valor: string;
  onSalvar: (novoValor: string) => void;
  tipo?: "input" | "textarea";
  label?: string;
}

export function EditableField({
  valor,
  onSalvar,
  tipo = "input",
  label,
}: EditableFieldProps) {
  const [editando, setEditando] = useState(false);
  const [temp, setTemp] = useState(valor);

  const salvar = () => {
    onSalvar(temp);
    setEditando(false);
  };

  const cancelar = () => {
    setTemp(valor);
    setEditando(false);
  };

  if (!editando) {
    return (
      <div className="group flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
          <p className="whitespace-pre-line text-sm text-foreground">{valor}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 opacity-0 group-hover:opacity-100"
          onClick={() => setEditando(true)}
          aria-label={`Editar ${label || "campo"}`}
        >
          <Pencil className="size-3.5" />
        </Button>
      </div>
    );
  }

  const Componente = tipo === "textarea" ? Textarea : Input;

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-medium text-muted-foreground">{label}</p>}
      <Componente
        value={temp}
        onChange={(e) => setTemp(e.target.value)}
        className="text-sm"
        rows={tipo === "textarea" ? 4 : undefined}
      />
      <div className="flex gap-1">
        <Button size="sm" variant="default" onClick={salvar}>
          <Check className="size-3.5" />
          Salvar
        </Button>
        <Button size="sm" variant="ghost" onClick={cancelar}>
          <X className="size-3.5" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}
