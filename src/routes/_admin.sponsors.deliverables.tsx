import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProject } from "@/hooks/useProject";
import {
  useCampanhas,
  useEntregas,
  usePostsProjeto,
  useSalvarEntrega,
} from "@/services/editorialQueries";
import { formatarDataHora } from "@/lib/format";

export const Route = createFileRoute("/_admin/sponsors/deliverables")({
  head: () => ({
    meta: [
      { title: "Entregas patrocinadas | Notícias Laguna" },
      {
        name: "description",
        content: "Controle das publicações contratadas, agendadas e já entregues por campanha.",
      },
      { property: "og:title", content: "Entregas patrocinadas | Notícias Laguna" },
      {
        property: "og:description",
        content: "Acompanhe as entregas de cada campanha de patrocínio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EntregasPage,
});

const STATUS: { valor: string; rotulo: string }[] = [
  { valor: "contracted", rotulo: "Contratada" },
  { valor: "scheduled", rotulo: "Agendada" },
  { valor: "published", rotulo: "Publicada" },
  { valor: "cancelled", rotulo: "Cancelada" },
];

const VAZIO = { campaign_id: "", post_id: "", scheduled_at: "", status: "contracted", notes: "" };

function EntregasPage() {
  const { data: projeto } = useProject();
  const projectId = projeto?.id;
  const { data: entregas, isLoading } = useEntregas(projectId);
  const { data: campanhas } = useCampanhas(projectId);
  const { data: posts } = usePostsProjeto(projectId);
  const salvar = useSalvarEntrega(projectId);

  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<typeof VAZIO & { id?: string }>(VAZIO);

  const patrocinados = (posts ?? []).filter((p) => p.is_sponsored);

  return (
    <PageContainer
      titulo="Entregas"
      descricao="Cada entrega liga uma campanha a uma publicação patrocinada."
      acoes={
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/sponsors/campaigns">Campanhas</Link>
          </Button>
          <Button
            size="sm"
            disabled={(campanhas ?? []).length === 0}
            onClick={() => {
              setForm(VAZIO);
              setAberto(true);
            }}
          >
            <Plus className="size-4" />
            Nova entrega
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <LoadingState titulo="Carregando entregas..." />
      ) : (entregas ?? []).length === 0 ? (
        <EmptyState
          titulo="Nenhuma entrega registrada"
          descricao={
            (campanhas ?? []).length === 0
              ? "Crie uma campanha antes de registrar entregas."
              : "Registre as publicações previstas em cada campanha."
          }
        />
      ) : (
        <div className="space-y-3">
          {(entregas ?? []).map((entrega) => (
            <Card key={entrega.id}>
              <CardContent className="space-y-2 pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {STATUS.find((s) => s.valor === entrega.status)?.rotulo ?? entrega.status}
                  </Badge>
                  {entrega.campaign_name ? (
                    <Badge variant="secondary">{entrega.campaign_name}</Badge>
                  ) : null}
                  {entrega.scheduled_at ? (
                    <span className="text-xs text-muted-foreground">
                      prevista para {formatarDataHora(entrega.scheduled_at)}
                    </span>
                  ) : null}
                  {entrega.published_at ? (
                    <span className="text-xs text-muted-foreground">
                      publicada em {formatarDataHora(entrega.published_at)}
                    </span>
                  ) : null}
                </div>
                {entrega.notes ? (
                  <p className="text-xs text-muted-foreground">{entrega.notes}</p>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setForm({
                      id: entrega.id,
                      campaign_id: entrega.campaign_id,
                      post_id: entrega.post_id ?? "",
                      scheduled_at: entrega.scheduled_at?.slice(0, 16) ?? "",
                      status: entrega.status,
                      notes: entrega.notes ?? "",
                    });
                    setAberto(true);
                  }}
                >
                  Editar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar entrega" : "Nova entrega"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Campanha</Label>
              <Select
                value={form.campaign_id}
                onValueChange={(v) => setForm((a) => ({ ...a, campaign_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha a campanha" />
                </SelectTrigger>
                <SelectContent>
                  {(campanhas ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.sponsor_name ? `${c.sponsor_name} — ${c.name}` : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Publicação patrocinada (opcional)</Label>
              <Select
                value={form.post_id}
                onValueChange={(v) => setForm((a) => ({ ...a, post_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  {patrocinados.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title ?? "(sem título)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="entrega-data">Data prevista</Label>
              <Input
                id="entrega-data"
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm((a) => ({ ...a, scheduled_at: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Situação</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((a) => ({ ...a, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS.map((s) => (
                    <SelectItem key={s.valor} value={s.valor}>
                      {s.rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="entrega-notas">Observações</Label>
              <Textarea
                id="entrega-notas"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((a) => ({ ...a, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button
              disabled={salvar.isPending || !form.campaign_id}
              onClick={() =>
                salvar.mutate(
                  {
                    id: form.id,
                    campaign_id: form.campaign_id,
                    post_id: form.post_id || null,
                    scheduled_at: form.scheduled_at
                      ? new Date(form.scheduled_at).toISOString()
                      : null,
                    status: form.status,
                    notes: form.notes.trim() || null,
                  },
                  { onSuccess: () => setAberto(false) },
                )
              }
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
