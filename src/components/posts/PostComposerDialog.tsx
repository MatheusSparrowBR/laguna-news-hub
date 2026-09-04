import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { ArtPreview } from "./ArtPreview";
import { PostInstagramPreview } from "./PostInstagramPreview";
import {
  TEMPLATE_KEYS,
  gerarHashtags,
  gerarLegendaPost,
  gerarTituloPost,
  hashtagsComoTexto,
  rotuloTemplate,
  templateParaNoticia,
  type TemplateKey,
} from "@/lib/templates/postTemplates";
import { exportarArte, baixarArquivo } from "@/lib/art/exportArt";
import { renderizarArteSvg } from "@/lib/art/renderArt";

import type { Campanha, EntradaPost, NoticiaEditorial, PostRegistro, Sponsor } from "@/services/editorialData";

export type TipoPost = "noticia" | "patrocinado";

interface Props {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  noticia?: NoticiaEditorial | null;
  post?: PostRegistro | null;
  patrocinadores: Sponsor[];
  campanhas: Campanha[];
  salvando?: boolean;
  onSalvar: (entrada: EntradaPost & { id?: string | undefined }) => void;
}

/** Compositor de publicação: notícia editorial ou conteúdo patrocinado. */
export function PostComposerDialog({
  aberto,
  onOpenChange,
  projectId,
  noticia,
  post,
  patrocinadores,
  campanhas,
  salvando,
  onSalvar,
}: Props) {
  const templateInicial: TemplateKey =
    (post?.template_key as TemplateKey | null) ??
    (post?.is_sponsored
      ? "patrocinado"
      : templateParaNoticia(
          noticia?.category_name?.toLowerCase() ?? null,
          noticia?.importance_score ?? 0,
        ));

  const [tipo, setTipo] = useState<TipoPost>(
    post?.is_sponsored ? "patrocinado" : noticia ? "noticia" : "noticia",
  );
  const [template, setTemplate] = useState<TemplateKey>(templateInicial);
  const [campanhaId, setCampanhaId] = useState(post?.campaign_id ?? "");
  const [titulo, setTitulo] = useState(
    post?.title ??
      (noticia
        ? gerarTituloPost({ newsTitle: noticia.title, template: templateInicial })
        : ""),
  );
  const [legenda, setLegenda] = useState(post?.caption ?? "");
  const [hashtags, setHashtags] = useState(
    post?.hashtags ?? hashtagsComoTexto(gerarHashtags(templateInicial)),
  );
  const [imagem, setImagem] = useState(post?.image_url ?? noticia?.image_url ?? "");
  const [agendamento, setAgendamento] = useState(post?.scheduled_at?.slice(0, 16) ?? "");
  const [exportando, setExportando] = useState(false);

  const campanha = campanhas.find((c) => c.id === campanhaId) ?? null;
  const patrocinador = patrocinadores.find((s) => s.id === campanha?.sponsor_id) ?? null;
  const patrocinado = tipo === "patrocinado";

  const entradaArte = useMemo(
    () => ({
      template: patrocinado ? ("patrocinado" as TemplateKey) : template,
      title: titulo || noticia?.title || "Título da publicação",
      subtitle: patrocinado ? (campanha?.name ?? null) : (noticia?.source_name ?? null),
      imageUrl: imagem || null,
      sourceName: patrocinado ? null : (noticia?.source_name ?? null),
      dateLabel: new Date(noticia?.discovered_at ?? Date.now()).toLocaleDateString("pt-BR"),
      sponsorName: patrocinado ? (patrocinador?.display_name ?? patrocinador?.name ?? null) : null,
      sponsorLogoUrl: patrocinado ? (patrocinador?.logo_url ?? null) : null,
      cta: null,
    }),
    [patrocinado, template, titulo, noticia, imagem, campanha, patrocinador],
  );

  const gerarTextos = () => {
    const tpl = patrocinado ? "patrocinado" : template;
    const nomePatrocinador = patrocinador?.display_name ?? patrocinador?.name ?? null;
    const novoTitulo = gerarTituloPost({
      newsTitle: noticia?.title ?? titulo,
      template: tpl,
      sponsorName: nomePatrocinador,
    });
    const legendaGerada = gerarLegendaPost({
      newsTitle: noticia?.title ?? titulo,
      content: noticia?.original_content ?? null,
      sourceName: noticia?.source_name ?? null,
      sourceUrl: noticia?.source_url ?? null,
      template: tpl,
      sponsorName: nomePatrocinador,
    });
    setTitulo(novoTitulo);
    setLegenda(legendaGerada.texto);
    setHashtags(hashtagsComoTexto(legendaGerada.hashtags));
    toast.success("Texto gerado pelos modelos do sistema.");
  };

  const baixarArte = async () => {
    setExportando(true);
    try {
      const svg = renderizarArteSvg({ ...entradaArte, format: "feed" });
      const arquivo = await exportarArte(svg, "feed", "image/png");
      baixarArquivo(arquivo, "noticias-laguna");
    } catch {
      toast.error("Não foi possível gerar a imagem neste navegador.");
    } finally {
      setExportando(false);
    }
  };

  const salvar = (status: string) => {
    if (patrocinado && !campanha) {
      toast.error("Escolha a campanha do patrocinador.");
      return;
    }
    if (!titulo.trim()) {
      toast.error("Escreva o título da publicação.");
      return;
    }
    onSalvar({
      id: post?.id,
      project_id: projectId,
      news_id: patrocinado ? null : (noticia?.id ?? post?.news_id ?? null),
      campaign_id: patrocinado ? campanha!.id : null,
      sponsor_id: patrocinado ? (campanha?.sponsor_id ?? null) : null,
      is_sponsored: patrocinado,
      post_type: "feed",
      title: titulo.trim(),
      caption: legenda.trim(),
      hashtags: hashtags.trim(),
      image_url: imagem.trim() || null,
      template_key: patrocinado ? "patrocinado" : template,
      channel: "instagram",
      status,
      scheduled_at: agendamento ? new Date(agendamento).toISOString() : null,
    });
  };

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compositor de publicação</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={tipo === "noticia" ? "default" : "outline"}
                  onClick={() => setTipo("noticia")}
                >
                  Notícia
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={patrocinado ? "default" : "outline"}
                  onClick={() => setTipo("patrocinado")}
                >
                  Patrocinado
                </Button>
              </div>
              {patrocinado ? (
                <Badge variant="outline" className="border-warning/40 bg-warning/10">
                  PUBLICIDADE — não entra no fluxo de notícias
                </Badge>
              ) : null}
            </div>

            {patrocinado ? (
              <div className="space-y-2">
                <Label>Campanha</Label>
                <Select value={campanhaId} onValueChange={setCampanhaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha a campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    {campanhas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.sponsor_name ? `${c.sponsor_name} — ${c.name}` : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Select value={template} onValueChange={(v) => setTemplate(v as TemplateKey)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_KEYS.filter((k) => k !== "patrocinado").map((k) => (
                      <SelectItem key={k} value={k}>
                        {rotuloTemplate(k)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="titulo-post">Título da publicação</Label>
              <Input id="titulo-post" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="legenda-post">Legenda</Label>
              <Textarea
                id="legenda-post"
                rows={8}
                value={legenda}
                onChange={(e) => setLegenda(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hashtags-post">Hashtags</Label>
              <Input
                id="hashtags-post"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagem-post">Imagem (endereço)</Label>
              <Input id="imagem-post" value={imagem} onChange={(e) => setImagem(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agenda-post">Data e hora do agendamento</Label>
              <Input
                id="agenda-post"
                type="datetime-local"
                value={agendamento}
                onChange={(e) => setAgendamento(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={gerarTextos}>
                Gerar texto pelos modelos
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void baixarArte()}
                disabled={exportando}
              >
                {exportando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                Baixar imagem
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Artes</p>
              <ArtPreview entrada={entradaArte} />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Como fica no Instagram</p>
              <PostInstagramPreview
                arte={entradaArte}
                legenda={[legenda, hashtags].filter(Boolean).join("\n\n")}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button variant="outline" disabled={salvando} onClick={() => salvar("draft")}>
            Salvar rascunho
          </Button>
          <Button disabled={salvando} onClick={() => salvar(agendamento ? "scheduled" : "approved")}>
            {agendamento ? "Agendar" : "Aprovar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
