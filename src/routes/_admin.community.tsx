import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Eye, FileVideo, ImagePlus, MapPin, Plus, ShieldAlert, Trash2, Upload, Video } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProject } from "@/hooks/useProject";
import { usePostsProjeto, usePatrocinadores, useCampanhas, useSalvarPost } from "@/services/editorialQueries";
import { PostComposerDialog } from "@/components/posts/PostComposerDialog";
import {
  COMMUNITY_CATEGORIES, COMMUNITY_SOURCES, STATUS_LABEL, STATUS_TONE,
  listarPautas, listarMidias, criarPauta, atualizarPauta, adicionarMidias,
  definirMidiaPrincipal, removerMidia, criarPostDaPauta, possuiConteudoSensivel,
  type CommunitySubmission, type CommunityMedia, type CommunityStatus, type ConsentMedia, type PublicationPermission,
} from "@/services/communitySubmissions";

export const Route = createFileRoute("/_admin/community")({
  head: () => ({
    meta: [
      { title: "Pautas da Comunidade | HORA NEWS LAGUNA" },
      { name: "description", content: "Relatos, imagens e vídeos enviados pela comunidade para avaliação editorial." },
    ],
  }),
  component: CommunityPage,
});

const statusTabs: Array<{ key: "all" | CommunityStatus; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "received", label: "Recebidas" },
  { key: "triage", label: "Triagem" },
  { key: "verifying", label: "Verificação" },
  { key: "approved", label: "Aprovadas" },
];

function CommunityPage() {
  const { data: project } = useProject();
  const projectId = project?.id;
  const queryClient = useQueryClient();
  const { data: pautas = [], isLoading } = useQuery({
    queryKey: ["community-submissions", projectId],
    queryFn: () => listarPautas(projectId!),
    enabled: Boolean(projectId),
  });
  const { data: patrocinadores = [] } = usePatrocinadores(projectId);
  const { data: campanhas = [] } = useCampanhas(projectId);
  const { data: posts = [] } = usePostsProjeto(projectId);
  const salvarPost = useSalvarPost(projectId);

  const [tab, setTab] = useState<"all" | CommunityStatus>("all");
  const [openForm, setOpenForm] = useState(false);
  const [selected, setSelected] = useState<CommunitySubmission | null>(null);
  const [media, setMedia] = useState<CommunityMedia[]>([]);
  const [openComposer, setOpenComposer] = useState(false);
  const [composerPost, setComposerPost] = useState<any>(null);
  const [openVerify, setOpenVerify] = useState(false);
  const [verification, setVerification] = useState<"yes" | "no" | "partial">("yes");
  const [verificationNotes, setVerificationNotes] = useState("");

  const filtered = useMemo(() => tab === "all" ? pautas : pautas.filter((p) => p.status === tab), [pautas, tab]);

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["community-submissions", projectId] });

  const openSubmission = async (submission: CommunitySubmission) => {
    setSelected(submission);
    try { setMedia(await listarMidias(submission.id, projectId!)); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível carregar a mídia."); }
  };

  const changeStatus = async (status: CommunityStatus, notes?: string) => {
    if (!selected) return;
    try {
      const updated = await atualizarPauta(projectId!, selected.id, { status, editorial_notes: notes ?? selected.editorial_notes });
      setSelected(updated); refresh();
      toast.success(`Pauta: ${STATUS_LABEL[status]}.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a pauta."); }
  };

  const createPost = async () => {
    if (!selected) return;
    try {
      const primary = media.find((m) => m.is_primary) ?? media[0] ?? null;
      const post = await criarPostDaPauta(projectId!, selected, primary);
      await atualizarPauta(projectId!, selected.id, { status: "converted_to_post" });
      const currentPosts = posts.length ? posts : [];
      const found = currentPosts.find((p) => p.id === post.id) ?? ({ ...post, project_id: projectId, community_submission_id: selected.id, title: "", caption: "", hashtags: "", image_url: primary?.signed_url ?? null, status: "draft", scheduled_at: null, is_sponsored: false, template_key: "comunidade", channel: "instagram", post_type: "feed" } as any);
      setComposerPost(found);
      setOpenComposer(true);
      refresh();
      toast.success("Rascunho criado. A publicação continua manual.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível criar a publicação."); }
  };

  return (
    <PageContainer
      titulo="Pautas da Comunidade"
      descricao="Relatos, imagens e vídeos enviados pela comunidade para avaliação editorial. Um relato não é notícia confirmada até passar pela revisão."
      acoes={<Button size="sm" onClick={() => setOpenForm(true)}><Plus className="size-4" />Nova pauta</Button>}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Summary label="Recebidas" value={pautas.filter((p) => p.status === "received").length} />
        <Summary label="Triagem" value={pautas.filter((p) => p.status === "triage").length} />
        <Summary label="Verificação" value={pautas.filter((p) => p.status === "verifying").length} />
        <Summary label="Verificadas" value={pautas.filter((p) => p.status === "verified").length} />
        <Summary label="Aprovadas" value={pautas.filter((p) => p.status === "approved").length} />
        <Summary label="Não confirmadas" value={pautas.filter((p) => p.status === "not_confirmed").length} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {statusTabs.map((item) => <Button key={item.key} size="sm" variant={tab === item.key ? "default" : "outline"} onClick={() => setTab(item.key)}>{item.label}</Button>)}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {isLoading ? <Card><CardContent className="p-6 text-sm text-muted-foreground">Carregando pautas...</CardContent></Card> : null}
        {!isLoading && filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Nenhuma pauta neste filtro.</CardContent></Card> : null}
        {filtered.map((pauta) => <SubmissionCard key={pauta.id} pauta={pauta} onOpen={() => void openSubmission(pauta)} />)}
      </div>

      <NewSubmissionDialog
        open={openForm}
        projectId={projectId}
        onOpenChange={setOpenForm}
        onCreated={() => { setOpenForm(false); refresh(); }}
      />

      <SubmissionDialog
        open={Boolean(selected)}
        submission={selected}
        media={media}
        projectId={projectId}
        sensitive={selected ? possuiConteudoSensivel(selected, media) : false}
        onOpenChange={(open) => { if (!open) { setSelected(null); setMedia([]); } }}
        onRefresh={async () => { refresh(); if (selected && projectId) { const fresh = await listarPautas(projectId); const s = fresh.find((x) => x.id === selected.id) ?? null; setSelected(s); if (s) setMedia(await listarMidias(s.id, projectId)); } }}
        onStatus={changeStatus}
        onVerify={() => setOpenVerify(true)}
        onCreatePost={() => void createPost()}
        onComposerClose={() => setOpenComposer(false)}
      />

      <Dialog open={openVerify} onOpenChange={setOpenVerify}>
        <DialogContent>
          <DialogHeader><DialogTitle>Verificação editorial</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Informação confirmada?</Label><Select value={verification} onValueChange={(v) => setVerification(v as typeof verification)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">SIM</SelectItem><SelectItem value="no">NÃO</SelectItem><SelectItem value="partial">PARCIALMENTE</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Como foi confirmada?</Label><Textarea value={verificationNotes} onChange={(e) => setVerificationNotes(e.target.value)} placeholder="Órgão público, envolvido, verificação local, documento ou outra fonte..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenVerify(false)}>Cancelar</Button><Button onClick={async () => { setOpenVerify(false); if (verification === "yes") await changeStatus("verified", verificationNotes); else if (verification === "no") await changeStatus("not_confirmed", verificationNotes); else await changeStatus("verified", `Parcialmente confirmado. ${verificationNotes}`); }}>Salvar verificação</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {openComposer && composerPost ? <PostComposerDialog
        key={composerPost.id}
        aberto
        onOpenChange={(open) => { if (!open) setOpenComposer(false); }}
        projectId={projectId!}
        post={composerPost}
        patrocinadores={patrocinadores}
        campanhas={campanhas}
        salvando={salvarPost.isPending}
        onSalvar={(entrada) => salvarPost.mutateAsync(entrada)}
      /> : null}
    </PageContainer>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold text-primary">{value}</p></CardContent></Card>;
}

function SubmissionCard({ pauta, onOpen }: { pauta: CommunitySubmission; onOpen: () => void }) {
  const [preview, setPreview] = useState<CommunityMedia | null>(null);
  return <Card className="overflow-hidden">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant={STATUS_TONE[pauta.status]}>{STATUS_LABEL[pauta.status]}</Badge><Badge variant="outline">{pauta.category}</Badge></div>
          <h2 className="font-semibold leading-snug">{pauta.title}</h2>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{pauta.description || "Sem descrição."}</p>
        </div>
        <Button size="sm" variant="outline" onClick={onOpen}><Eye className="size-4" />Abrir</Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground"><span>{pauta.source_type}</span>{pauta.neighborhood ? <span>📍 {pauta.neighborhood}</span> : null}<span>{new Date(pauta.created_at).toLocaleString("pt-BR")}</span></div>
      <p className="mt-3 text-xs font-medium text-primary">Relato recebido — não confirmado automaticamente.</p>
    </CardContent>
    {preview ? <MediaPreview media={preview} onClose={() => setPreview(null)} /> : null}
  </Card>;
}

function NewSubmissionDialog({ open, onOpenChange, projectId, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; projectId?: string; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", category: "Outro", neighborhood: "", location: "", occurred_at: "", source_type: "Morador", submitter_name: "", submitter_phone: "", submitter_email: "", consent_media: "not_informed" as ConsentMedia, publication_permission: "pending" as PublicationPermission, editorial_notes: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    if (!projectId || !form.title.trim()) { toast.error("Informe um título interno."); return; }
    setSaving(true);
    try {
      const pauta = await criarPauta(projectId, { ...form, occurred_at: form.occurred_at ? new Date(form.occurred_at).toISOString() : null });
      if (files.length) await adicionarMidias({ projectId, submissionId: pauta.id, files });
      toast.success("Pauta recebida. Ela permanece no fluxo editorial manual.");
      setFiles([]); onCreated();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível criar a pauta."); }
    finally { setSaving(false); }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle>Nova pauta da comunidade</DialogTitle></DialogHeader>
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Título interno"><Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex.: Vazamento de água no bairro X" /></Field>
      <Field label="Categoria"><Select value={form.category} onValueChange={(v) => set("category", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COMMUNITY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></Field>
      <div className="md:col-span-2"><Field label="Descrição do ocorrido"><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} /></Field></div>
      <Field label="Bairro"><Input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} /></Field><Field label="Local / endereço, se apropriado"><Input value={form.location} onChange={(e) => set("location", e.target.value)} /></Field>
      <Field label="Data e hora do fato"><Input type="datetime-local" value={form.occurred_at} onChange={(e) => set("occurred_at", e.target.value)} /></Field>
      <Field label="Origem"><Select value={form.source_type} onValueChange={(v) => set("source_type", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COMMUNITY_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></Field>
      <Field label="Nome do remetente (interno)"><Input value={form.submitter_name} onChange={(e) => set("submitter_name", e.target.value)} /></Field><Field label="Telefone (interno)"><Input value={form.submitter_phone} onChange={(e) => set("submitter_phone", e.target.value)} /></Field><Field label="E-mail (interno)"><Input value={form.submitter_email} onChange={(e) => set("submitter_email", e.target.value)} /></Field>
      <Field label="Uso da mídia"><Select value={form.consent_media} onValueChange={(v) => set("consent_media", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="authorized">Autorizado</SelectItem><SelectItem value="not_authorized">Não autorizado</SelectItem><SelectItem value="not_informed">Não informado</SelectItem></SelectContent></Select></Field>
      <Field label="Permissão de publicação"><Select value={form.publication_permission} onValueChange={(v) => set("publication_permission", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Sim</SelectItem><SelectItem value="no">Não</SelectItem><SelectItem value="pending">Pendente</SelectItem></SelectContent></Select></Field>
      <div className="md:col-span-2"><Field label="Observações internas"><Textarea value={form.editorial_notes} onChange={(e) => set("editorial_notes", e.target.value)} /></Field></div>
      <div className="md:col-span-2 rounded-lg border border-dashed p-4"><Label>Mídias</Label><Input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" className="mt-2" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} /><p className="mt-2 text-xs text-muted-foreground">Imagem: JPG/PNG/WEBP até 25 MB. Vídeo: MP4/MOV/WEBM até 100 MB. Até 10 arquivos. A mídia é privada.</p>{files.length ? <p className="mt-2 text-sm">{files.length} arquivo(s) selecionado(s).</p> : null}</div>
    </div>
    <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button><Button onClick={() => void submit()} disabled={saving}><Upload className="size-4" />Receber pauta</Button></DialogFooter>
  </DialogContent></Dialog>;
}

function SubmissionDialog({ open, submission, media, projectId, sensitive, onOpenChange, onRefresh, onStatus, onVerify, onCreatePost }: { open: boolean; submission: CommunitySubmission | null; media: CommunityMedia[]; projectId?: string; sensitive: boolean; onOpenChange: (v: boolean) => void; onRefresh: () => Promise<void>; onStatus: (status: CommunityStatus, notes?: string) => Promise<void>; onVerify: () => void; onCreatePost: () => void; onComposerClose: () => void }) {
  if (!submission || !projectId) return null;
  const canCreatePost = submission.status === "approved" && submission.publication_permission === "yes";
  const canAddMedia = submission.status !== "converted_to_post";
  const [files, setFiles] = useState<File[]>([]);
  const upload = async () => { if (!files.length) return; try { await adicionarMidias({ projectId, submissionId: submission.id, files }); setFiles([]); await onRefresh(); toast.success("Mídia adicionada."); } catch (error) { toast.error(error instanceof Error ? error.message : "Falha no upload."); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[94vh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>{submission.title}</DialogTitle></DialogHeader>
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        {sensitive ? <div className="flex gap-3 rounded-lg border border-accent bg-warning-soft p-3 text-sm"><ShieldAlert className="size-5 shrink-0" /><div><strong>Atenção: conteúdo sensível.</strong><p>Há indícios de pessoa, criança, acidente ou violência. A decisão é exclusivamente humana.</p></div></div> : null}
        <div className="grid gap-3 sm:grid-cols-2"><Info label="Status" value={STATUS_LABEL[submission.status]} /><Info label="Categoria" value={submission.category} /><Info label="Origem" value={submission.source_type} /><Info label="Bairro" value={submission.neighborhood || "—"} /><Info label="Local" value={submission.location || "—"} /><Info label="Fato" value={submission.occurred_at ? new Date(submission.occurred_at).toLocaleString("pt-BR") : "—"} /></div>
        <div><Label>Descrição</Label><p className="mt-1 whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">{submission.description || "Sem descrição."}</p></div>
        <div className="grid gap-3 sm:grid-cols-2"><Info label="Uso da mídia" value={submission.consent_media} /><Info label="Permissão de publicação" value={submission.publication_permission} /></div>
        <div><Label>Observações internas</Label><p className="mt-1 whitespace-pre-wrap rounded-lg border p-3 text-sm">{submission.editorial_notes || "Sem observações."}</p></div>
        <div><Label>Identificação interna</Label><div className="mt-1 grid gap-2 rounded-lg border p-3 text-sm"><span>Nome: {submission.submitter_name || "—"}</span><span>Telefone: {submission.submitter_phone || "—"}</span><span>E-mail: {submission.submitter_email || "—"}</span></div><p className="mt-2 text-xs text-muted-foreground">Esses dados não entram automaticamente em título, legenda, arte ou feed.</p></div>
        <div><Label>Mídias recebidas</Label><div className="mt-2 grid gap-3 sm:grid-cols-2">{media.map((m) => <MediaItem key={m.id} media={m} projectId={projectId} submissionId={submission.id} onRefresh={onRefresh} />)}</div></div>
        {canAddMedia ? <div className="rounded-lg border border-dashed p-3"><Input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} /><div className="mt-2 flex gap-2"><Button size="sm" onClick={() => void upload()} disabled={!files.length}><Upload className="size-4" />Enviar mídia</Button><span className="text-xs text-muted-foreground self-center">até 10 arquivos por pauta</span></div></div> : null}
      </div>
      <div className="space-y-3"><Card><CardHeader><CardTitle className="text-sm">Fluxo editorial</CardTitle></CardHeader><CardContent className="space-y-2">
        {submission.status === "received" ? <Button className="w-full" onClick={() => void onStatus("triage")}>Triar</Button> : null}
        {submission.status === "triage" ? <Button className="w-full" onClick={() => void onStatus("verifying")}>Verificar</Button> : null}
        {submission.status === "verifying" ? <Button className="w-full" onClick={onVerify}>Registrar verificação</Button> : null}
        {submission.status === "verified" ? <Button className="w-full" onClick={() => void onStatus("approved")}>Aprovar</Button> : null}
        {submission.status === "approved" ? <Button className="w-full" disabled={!canCreatePost} onClick={onCreatePost}><CheckCircle2 className="size-4" />Criar publicação</Button> : null}
        {submission.status !== "rejected" && submission.status !== "not_confirmed" && submission.status !== "converted_to_post" ? <><Button variant="outline" className="w-full" onClick={() => void onStatus("not_confirmed")}>Não confirmada</Button><Button variant="destructive" className="w-full" onClick={() => void onStatus("rejected")}>Rejeitar</Button></> : null}
        {!canCreatePost && submission.status === "approved" ? <p className="text-xs text-muted-foreground">A publicação exige permissão de publicação = Sim.</p> : null}
      </CardContent></Card></div>
    </div>
    <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button></DialogFooter>
  </DialogContent></Dialog>;
}

function MediaItem({ media, projectId, submissionId, onRefresh }: { media: CommunityMedia; projectId: string; submissionId: string; onRefresh: () => Promise<void> }) {
  const remove = async () => { try { await removerMidia(projectId, submissionId, media.id); await onRefresh(); toast.success("Mídia removida."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível remover."); } };
  const primary = async () => { try { await definirMidiaPrincipal(projectId, submissionId, media.id); await onRefresh(); toast.success("Mídia principal definida."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível definir a mídia principal."); } };
  return <div className="overflow-hidden rounded-lg border bg-card"><div className="aspect-video bg-muted">{media.signed_url ? media.media_type === "image" ? <img src={media.signed_url} alt={media.caption || media.original_filename} className="h-full w-full object-cover" /> : <video src={media.signed_url} controls className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><FileVideo /></div>}</div><div className="space-y-2 p-2"><div className="flex items-center gap-2 text-xs"><Badge variant="outline">{media.media_type === "image" ? "Imagem" : "Vídeo"}</Badge>{media.is_primary ? <Badge>Principal</Badge> : null}</div><p className="truncate text-xs">{media.original_filename}</p><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void primary()} disabled={media.is_primary}>Principal</Button><Button size="sm" variant="ghost" onClick={() => void remove}><Trash2 className="size-4" /></Button></div></div></div>;
}

function MediaPreview({ media, onClose }: { media: CommunityMedia; onClose: () => void }) { return <Dialog open onOpenChange={onClose}><DialogContent><DialogHeader><DialogTitle>Prévia da mídia</DialogTitle></DialogHeader>{media.signed_url ? media.media_type === "image" ? <img src={media.signed_url} alt={media.original_filename} className="max-h-[70vh] w-full object-contain" /> : <video src={media.signed_url} controls className="max-h-[70vh] w-full" /> : null}</DialogContent></Dialog>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>; }
