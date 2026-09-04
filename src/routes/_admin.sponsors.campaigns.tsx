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
import { useCampanhas, usePatrocinadores, useSalvarCampanha } from "@/services/editorialQueries";
import type { Campanha } from "@/services/editorialData";

export const Route = createFileRoute("/_admin/sponsors/campaigns")({
  head: () => ({
    meta: [
      { title: "Campanhas | Notícias Laguna" },
      {
        name: "description",
        content:
          "Campanhas contratadas pelos patrocinadores, com período, valor e publicações previstas.",
      },
      { property: "og:title", content: "Campanhas | Notícias Laguna" },
      {
        property: "og:description",
        content: "Controle das campanhas dos patrocinadores de Laguna.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CampanhasPage,
});

const STATUS: { valor: string; rotulo: string }[] = [
  { valor: "draft", rotulo: "Rascunho" },
  { valor: "active", rotulo: "Ativa" },
  { valor: "paused", rotulo: "Pausada" },
  { valor: "completed", rotulo: "Concluída" },
  { valor: "cancelled", rotulo: "Cancelada" },
];

const VAZIO = {
  sponsor_id: "",
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  budget: "",
  contracted_posts: "0",
  status: "draft",
  notes: "",
};

function moeda(valor: number | null): string {
  if (valor === null) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function CampanhasPage() {
  const { data: projeto } = useProject();
  const projectId = projeto?.id;
  const { data: campanhas, isLoading } = useCampanhas(projectId);
  const { data: patrocinadores } = usePatrocinadores(projectId);
  const salvar = useSalvarCampanha(projectId);

  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<typeof VAZIO & { id?: string }>(VAZIO);

  const abrirEdicao = (campanha: Campanha) => {
    setForm({
      id: campanha.id,
      sponsor_id: campanha.sponsor_id,
      name: campanha.name,
      description: campanha.description ?? "",
      start_date: campanha.start_date ?? "",
      end_date: campanha.end_date ?? "",
      budget: campanha.budget === null ? "" : String(campanha.budget),
      contracted_posts: String(campanha.contracted_posts),
      status: campanha.status,
      notes: campanha.notes ?? "",
    });
    setAberto(true);
  };

  return (
    <PageContainer
      titulo="Campanhas"
      descricao="Somente valores realmente cadastrados aparecem aqui."
      acoes={
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/sponsors/deliverables">Entregas</Link>
          </Button>
          <Button
            size="sm"
            disabled={(patrocinadores ?? []).length === 0}
            onClick={() => {
              setForm(VAZIO);
              setAberto(true);
            }}
          >
            <Plus className="size-4" />
            Nova campanha
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <LoadingState titulo="Carregando campanhas..." />
      ) : (campanhas ?? []).length === 0 ? (
        <EmptyState
          titulo="Nenhuma campanha cadastrada"
          descricao={
            (patrocinadores ?? []).length === 0
              ? "Cadastre um patrocinador antes de criar campanhas."
              : "Crie a primeira campanha para começar a controlar as entregas."
          }
        />
      ) : (
        <div className="space-y-3">
          {(campanhas ?? []).map((campanha) => {
            const restantes = Math.max(campanha.contracted_posts - campanha.delivered_posts, 0);
            return (
              <Card key={campanha.id}>
                <CardContent className="space-y-2 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {STATUS.find((s) => s.valor === campanha.status)?.rotulo ?? campanha.status}
                    </Badge>
                    {campanha.sponsor_name ? (
                      <Badge variant="secondary">{campanha.sponsor_name}</Badge>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {campanha.start_date ?? "sem início"} até {campanha.end_date ?? "sem fim"}
                    </span>
                  </div>
                  <h2 className="text-sm font-semibold">{campanha.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    Valor {moeda(campanha.budget)} · contratadas {campanha.contracted_posts} ·
                    entregues {campanha.delivered_posts} · restantes {restantes}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => abrirEdicao(campanha)}>
                    Editar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar campanha" : "Nova campanha"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Patrocinador</Label>
              <Select
                value={form.sponsor_id}
                onValueChange={(v) => setForm((a) => ({ ...a, sponsor_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o patrocinador" />
                </SelectTrigger>
                <SelectContent>
                  {(patrocinadores ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.display_name || s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="campanha-nome">Nome</Label>
              <Input
                id="campanha-nome"
                value={form.name}
                onChange={(e) => setForm((a) => ({ ...a, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="campanha-inicio">Início</Label>
                <Input
                  id="campanha-inicio"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((a) => ({ ...a, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="campanha-fim">Fim</Label>
                <Input
                  id="campanha-fim"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((a) => ({ ...a, end_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="campanha-valor">Valor combinado (R$)</Label>
                <Input
                  id="campanha-valor"
                  inputMode="decimal"
                  value={form.budget}
                  onChange={(e) => setForm((a) => ({ ...a, budget: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="campanha-posts">Publicações contratadas</Label>
                <Input
                  id="campanha-posts"
                  inputMode="numeric"
                  value={form.contracted_posts}
                  onChange={(e) => setForm((a) => ({ ...a, contracted_posts: e.target.value }))}
                />
              </div>
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
              <Label htmlFor="campanha-desc">Descrição</Label>
              <Textarea
                id="campanha-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((a) => ({ ...a, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button
              disabled={salvar.isPending || !form.name.trim() || !form.sponsor_id}
              onClick={() =>
                salvar.mutate(
                  {
                    id: form.id,
                    sponsor_id: form.sponsor_id,
                    name: form.name.trim(),
                    description: form.description.trim() || null,
                    start_date: form.start_date || null,
                    end_date: form.end_date || null,
                    budget: form.budget ? Number(form.budget.replace(",", ".")) : null,
                    contracted_posts: Number(form.contracted_posts) || 0,
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
