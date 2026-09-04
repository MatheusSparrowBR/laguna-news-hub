import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Megaphone } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { MetricCard } from "@/components/common/MetricCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  usePatrocinadores,
  useSalvarPatrocinador,
} from "@/services/editorialQueries";
import { Handshake, CalendarClock, PackageCheck } from "lucide-react";
import type { Sponsor } from "@/services/editorialData";

export const Route = createFileRoute("/_admin/sponsors/")({
  head: () => ({
    meta: [
      { title: "Patrocinadores | HORA NEWS LAGUNA" },
      {
        name: "description",
        content: "Cadastro de patrocinadores e visão geral das campanhas contratadas.",
      },
      { property: "og:title", content: "Patrocinadores | HORA NEWS LAGUNA" },
      {
        property: "og:description",
        content: "Controle comercial dos patrocinadores do perfil de notícias de Laguna.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PatrocinadoresPage,
});

const VAZIO = {
  name: "",
  display_name: "",
  contact_name: "",
  email: "",
  phone: "",
  instagram_handle: "",
  website: "",
  logo_url: "",
  notes: "",
};

function PatrocinadoresPage() {
  const { data: projeto } = useProject();
  const projectId = projeto?.id;
  const { data: patrocinadores, isLoading } = usePatrocinadores(projectId);
  const { data: campanhas } = useCampanhas(projectId);
  const { data: entregas } = useEntregas(projectId);
  const salvar = useSalvarPatrocinador(projectId);

  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState<typeof VAZIO & { id?: string }>(VAZIO);

  const ativos = (patrocinadores ?? []).filter((s) => s.active).length;
  const campanhasAtivas = (campanhas ?? []).filter((c) => c.status === "active").length;
  const entregasPendentes = (entregas ?? []).filter(
    (e) => e.status === "contracted" || e.status === "scheduled",
  ).length;

  const abrirEdicao = (sponsor: Sponsor) => {
    setForm({
      id: sponsor.id,
      name: sponsor.name,
      display_name: sponsor.display_name ?? "",
      contact_name: sponsor.contact_name ?? "",
      email: sponsor.email ?? "",
      phone: sponsor.phone ?? "",
      instagram_handle: sponsor.instagram_handle ?? "",
      website: sponsor.website ?? "",
      logo_url: sponsor.logo_url ?? "",
      notes: sponsor.notes ?? "",
    });
    setAberto(true);
  };

  const campos: { chave: keyof typeof VAZIO; rotulo: string }[] = [
    { chave: "name", rotulo: "Nome" },
    { chave: "display_name", rotulo: "Nome de exibição" },
    { chave: "contact_name", rotulo: "Pessoa de contato" },
    { chave: "email", rotulo: "E-mail" },
    { chave: "phone", rotulo: "Telefone" },
    { chave: "instagram_handle", rotulo: "Instagram" },
    { chave: "website", rotulo: "Site" },
    { chave: "logo_url", rotulo: "Logo (endereço da imagem)" },
  ];

  return (
    <PageContainer
      titulo="Patrocinadores"
      descricao="Controle comercial. Não há cobrança nem pagamento aqui."
      acoes={
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/sponsors/campaigns">
              <Megaphone className="size-4" />
              Campanhas
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setForm(VAZIO);
              setAberto(true);
            }}
          >
            <Plus className="size-4" />
            Novo
          </Button>
        </div>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <MetricCard titulo="Patrocinadores ativos" valor={ativos} icone={Handshake} />
        <MetricCard titulo="Campanhas ativas" valor={campanhasAtivas} icone={CalendarClock} />
        <MetricCard titulo="Entregas pendentes" valor={entregasPendentes} icone={PackageCheck} />
      </div>

      {isLoading ? (
        <LoadingState titulo="Carregando patrocinadores..." />
      ) : (patrocinadores ?? []).length === 0 ? (
        <EmptyState
          titulo="Nenhum patrocinador cadastrado"
          descricao="Cadastre o primeiro para criar campanhas e publicações patrocinadas."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {(patrocinadores ?? []).map((sponsor) => (
            <Card key={sponsor.id}>
              <CardContent className="space-y-2 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">
                    {sponsor.display_name || sponsor.name}
                  </h2>
                  <Badge variant={sponsor.active ? "secondary" : "outline"}>
                    {sponsor.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                {sponsor.contact_name ? (
                  <p className="text-xs text-muted-foreground">{sponsor.contact_name}</p>
                ) : null}
                {sponsor.email ? (
                  <p className="text-xs text-muted-foreground">{sponsor.email}</p>
                ) : null}
                {sponsor.phone ? (
                  <p className="text-xs text-muted-foreground">{sponsor.phone}</p>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => abrirEdicao(sponsor)}>
                  Editar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar patrocinador" : "Novo patrocinador"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {campos.map((campo) => (
              <div key={campo.chave} className="space-y-1.5">
                <Label htmlFor={`sponsor-${campo.chave}`}>{campo.rotulo}</Label>
                <Input
                  id={`sponsor-${campo.chave}`}
                  value={form[campo.chave]}
                  onChange={(e) => setForm((a) => ({ ...a, [campo.chave]: e.target.value }))}
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label htmlFor="sponsor-notes">Observações</Label>
              <Textarea
                id="sponsor-notes"
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
              disabled={salvar.isPending || !form.name.trim()}
              onClick={() =>
                salvar.mutate(
                  {
                    id: form.id,
                    name: form.name.trim(),
                    display_name: form.display_name.trim() || null,
                    contact_name: form.contact_name.trim() || null,
                    email: form.email.trim() || null,
                    phone: form.phone.trim() || null,
                    instagram_handle: form.instagram_handle.trim() || null,
                    website: form.website.trim() || null,
                    logo_url: form.logo_url.trim() || null,
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
