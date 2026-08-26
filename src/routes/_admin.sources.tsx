import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageContainer, SectionCard } from "@/components/layout/PageContainer";
import { Modal } from "@/components/common/Modal";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listarFontes } from "@/services/mockService";
import { formatarDataHora, formatarNumero } from "@/lib/format";
import type { Source } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/sources")({
  head: () => ({
    meta: [
      { title: "Fontes | Projeto Notícias Laguna" },
      {
        name: "description",
        content:
          "Cadastre e gerencie os sites, feeds RSS e perfis usados para coletar notícias de Laguna.",
      },
      { property: "og:title", content: "Fontes | Projeto Notícias Laguna" },
      {
        property: "og:description",
        content: "Gerenciamento das fontes de notícias de Laguna - SC.",
      },
    ],
  }),
  component: SourcesPage,
});

const tipoLabel: Record<Source["tipo"], string> = {
  site: "Site",
  rss: "RSS",
  rede_social: "Rede social",
};

function SourcesPage() {
  const fontes = listarFontes();
  const [novaAberta, setNovaAberta] = useState(false);
  const [remover, setRemover] = useState<Source | null>(null);

  return (
    <PageContainer
      titulo="Fontes"
      descricao={`${fontes.filter((f) => f.ativa).length} de ${fontes.length} fontes ativas`}
      acoes={
        <Button size="sm" onClick={() => setNovaAberta(true)}>
          <Plus className="size-4" />
          Nova fonte
        </Button>
      }
    >
      <SectionCard titulo="Fontes cadastradas">
        <div className="space-y-3">
          {fontes.map((fonte) => (
            <div
              key={fonte.id}
              className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-sm font-semibold text-foreground">
                    {fonte.nome}
                  </p>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                    {tipoLabel[fonte.tipo]}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{fonte.url}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Última coleta: {formatarDataHora(fonte.ultimaColeta)} ·{" "}
                  {formatarNumero(fonte.noticiasColetadas)} notícias
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`ativa-${fonte.id}`}
                    defaultChecked={fonte.ativa}
                    onCheckedChange={(v) =>
                      toast.success(v ? "Fonte ativada (simulado)" : "Fonte desativada (simulado)")
                    }
                  />
                  <Label htmlFor={`ativa-${fonte.id}`} className="text-xs text-muted-foreground">
                    Ativa
                  </Label>
                </div>
                <Button variant="outline" size="sm" onClick={() => setRemover(fonte)}>
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <Modal
        aberto={novaAberta}
        onOpenChange={setNovaAberta}
        titulo="Nova fonte"
        descricao="Cadastre um site, feed RSS ou perfil para coleta de notícias."
        rodape={
          <Button
            onClick={() => {
              setNovaAberta(false);
              toast.success("Fonte cadastrada (simulado)");
            }}
          >
            Salvar fonte
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome-fonte">Nome</Label>
            <Input id="nome-fonte" placeholder="Ex.: Diário Laguna" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url-fonte">Endereço</Label>
            <Input id="url-fonte" placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo-fonte">Tipo</Label>
            <Select defaultValue="site">
              <SelectTrigger id="tipo-fonte">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="site">Site</SelectItem>
                <SelectItem value="rss">RSS</SelectItem>
                <SelectItem value="rede_social">Rede social</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Modal>

      <ConfirmationDialog
        aberto={remover !== null}
        onOpenChange={(aberto) => !aberto && setRemover(null)}
        titulo="Remover fonte?"
        descricao={`A fonte ${remover?.nome ?? ""} deixará de ser consultada.`}
        destrutivo
        textoConfirmar="Remover"
        onConfirmar={() => {
          toast.success("Fonte removida (simulado)");
          setRemover(null);
        }}
      />
    </PageContainer>
  );
}
