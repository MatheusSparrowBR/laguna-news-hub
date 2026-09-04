import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { renderizarArteSvg, svgParaBlobUrl, type EntradaArte } from "@/lib/art/renderArt";
import { baixarArquivo, exportarArte } from "@/lib/art/exportArt";
import { DIMENSOES, ROTULO_FORMATO, type ArtFormat } from "@/lib/art/artTemplates";

type ArtSelection = "feed" | "story" | "both";

/** Preview e exportação dos formatos oficiais do Instagram. A prévia usa o mesmo SVG da exportação. */
export function ArtPreview({
  entrada,
  formatos = ["feed", "story"],
}: {
  entrada: Omit<EntradaArte, "format">;
  formatos?: readonly ArtFormat[];
}) {
  const permitidos = useMemo(() => {
    const result = formatos.filter((f) => f === "feed" || f === "story");
    return result.length ? Array.from(new Set(result)) : (["feed", "story"] as ArtFormat[]);
  }, [formatos]);
  const [selection, setSelection] = useState<ArtSelection>(permitidos.includes("feed") && permitidos.includes("story") ? "both" : permitidos[0]);
  const exibidos = selection === "both" ? permitidos : permitidos.filter((f) => f === selection);
  const svgs = useMemo(
    () => exibidos.map((formato) => ({ formato, svg: renderizarArteSvg({ ...entrada, format: formato }) })),
    [entrada, exibidos],
  );
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const urls = Object.fromEntries(svgs.map(({ formato, svg }) => [formato, svgParaBlobUrl(svg)]));
    setPreviewUrls(urls);
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [svgs]);

  useEffect(() => {
    if (selection === "both" && permitidos.length < 2) setSelection(permitidos[0]);
    else if (selection !== "both" && !permitidos.includes(selection)) setSelection(permitidos[0]);
  }, [permitidos, selection]);

  const baixar = async (formato: ArtFormat) => {
    try {
      const svg = renderizarArteSvg({ ...entrada, format: formato });
      const arquivo = await exportarArte(svg, formato, "image/png");
      baixarArquivo(arquivo, `hora-news-laguna-${formato}`);
    } catch {
      toast.error(`Não foi possível gerar a arte de ${formato === "feed" ? "Feed" : "Stories"}.`);
    }
  };

  const baixarSelecionados = async () => {
    for (const formato of exibidos) await baixar(formato);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Formato da publicação</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Formato da publicação">
          {permitidos.includes("feed") ? <Button type="button" size="sm" variant={selection === "feed" ? "default" : "outline"} onClick={() => setSelection("feed")}>Feed</Button> : null}
          {permitidos.includes("story") ? <Button type="button" size="sm" variant={selection === "story" ? "default" : "outline"} onClick={() => setSelection("story")}>Stories</Button> : null}
          {permitidos.includes("feed") && permitidos.includes("story") ? <Button type="button" size="sm" variant={selection === "both" ? "default" : "outline"} onClick={() => setSelection("both")}>Feed + Stories</Button> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        {svgs.map(({ formato }) => {
          const { width, height } = DIMENSOES[formato];
          const largura = formato === "story" ? 190 : 300;
          const url = previewUrls[formato];
          return (
            <figure key={formato} className="space-y-2">
              {url ? <img src={url} alt={`Arte ${ROTULO_FORMATO[formato]}: ${entrada.title}`} width={largura} height={Math.round((largura * height) / width)} className="w-full max-w-[300px] rounded-lg border border-border shadow-sm" /> : <div className="flex aspect-[4/5] w-full max-w-[300px] items-center justify-center rounded-lg border border-border bg-muted text-xs text-muted-foreground">Carregando preview…</div>}
              <figcaption className="text-xs text-muted-foreground">{ROTULO_FORMATO[formato]} · {width}×{height}</figcaption>
              <Button type="button" size="sm" variant="outline" className="w-full max-w-[300px]" onClick={() => void baixar(formato)}><Download className="size-4" /> Baixar {formato === "feed" ? "Feed" : "Stories"}</Button>
            </figure>
          );
        })}
      </div>

      {selection === "both" && exibidos.length === 2 ? <Button type="button" variant="secondary" onClick={() => void baixarSelecionados()}><Download className="size-4" /> Baixar Feed + Stories</Button> : null}
    </div>
  );
}
