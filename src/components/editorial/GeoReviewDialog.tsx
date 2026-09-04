import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GeoBadge } from "./GeoBadge";
import type { DecisaoGeo, NoticiaEditorial } from "@/services/editorialData";

const OPCOES: { valor: DecisaoGeo; rotulo: string }[] = [
  { valor: "local", rotulo: "É de Laguna" },
  { valor: "uncertain", rotulo: "Ainda incerta" },
  { valor: "outside", rotulo: "Não é de Laguna" },
];

/**
 * Correção humana da decisão geográfica.
 * A decisão automática continua visível e não é apagada.
 */
export function GeoReviewDialog({
  noticia,
  aberto,
  onOpenChange,
  onSalvar,
  salvando,
}: {
  noticia: NoticiaEditorial | null;
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  onSalvar: (entrada: { manual_decision: DecisaoGeo; review_notes?: string | undefined }) => void;
  salvando?: boolean;
}) {
  const geo = noticia?.geo ?? null;
  const [escolha, setEscolha] = useState<DecisaoGeo>(geo?.manual_decision ?? geo?.decision ?? "uncertain");
  const [nota, setNota] = useState(geo?.review_notes ?? "");

  if (!noticia) return null;

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug">{noticia.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground">Decisão automática</p>
            <div className="mt-1 flex items-center gap-2">
              <GeoBadge decisao={geo?.decision ?? null} />
              {geo ? (
                <span className="text-xs text-muted-foreground">pontuação {geo.score}</span>
              ) : null}
            </div>
            {geo?.reason ? <p className="mt-2 text-xs text-muted-foreground">{geo.reason}</p> : null}
            {geo && geo.matched_localities.length > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Localidades: {geo.matched_localities.join(", ")}
              </p>
            ) : null}
            {geo && geo.excluded_localities.length > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Cidades de fora: {geo.excluded_localities.join(", ")}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Sua decisão</Label>
            <div className="flex flex-wrap gap-2">
              {OPCOES.map((opcao) => (
                <Button
                  key={opcao.valor}
                  type="button"
                  size="sm"
                  variant={escolha === opcao.valor ? "default" : "outline"}
                  onClick={() => setEscolha(opcao.valor)}
                >
                  {opcao.rotulo}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nota-geo">Observação (opcional)</Label>
            <Textarea
              id="nota-geo"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Por que esta notícia é ou não de Laguna?"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={salvando}
            onClick={() =>
              onSalvar({ manual_decision: escolha, review_notes: nota.trim() || undefined })
            }
          >
            Salvar revisão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
