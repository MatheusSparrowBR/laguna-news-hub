import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { renderizarArteSvg, svgParaBlobUrl, type EntradaArte } from "@/lib/art/renderArt";
import { baixarArquivo, exportarArte } from "@/lib/art/exportArt";
import { DIMENSOES, ROTULO_FORMATO, type ArtFormat } from "@/lib/art/artTemplates";
import { OFFICIAL_INSTAGRAM_TEMPLATE } from "@/lib/art/officialInstagramTemplateV3";
import { OFFICIAL_INSTAGRAM_STORY_TEMPLATE } from "@/lib/art/officialInstagramStoryTemplate";

type ArtSelection = "feed" | "story" | "both";

function primeiroFormatoSeguro(formatos: readonly ArtFormat[]): "feed" | "story" {
  if (formatos.includes("feed")) return "feed";
  return "story";
}

export function ArtPreview({ entrada, formatos = ["feed", "story"] }: { entrada: Omit<EntradaArte, "format">; formatos?: readonly ArtFormat[] }) {
  const permitidos = useMemo(() => {
    const result = formatos.filter((f) => f === "feed" || f === "story");
    return result.length ? Array.from(new Set(result)) : (["feed", "story"] as ArtFormat[]);
  }, [formatos]);
  const [selection, setSelection] = useState<ArtSelection>(() =>
    permitidos.includes("feed") && permitidos.includes("story") ? "both" : primeiroFormatoSeguro(permitidos),
  );
  const exibidos = selection === "both" ? permitidos : permitidos.filter((f) => f === selection);
  const svgs = useMemo(() => exibidos.map((formato) => ({ formato, svg: renderizarArteSvg({ ...entrada, format: formato }) })), [entrada, exibidos]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const urls = Object.fromEntries(svgs.map(({ formato, svg }) => [formato, svgParaBlobUrl(svg)]));
    setPreviewUrls(urls);
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [svgs]);

  useEffect(() => {
    const primeiro = primeiroFormatoSeguro(permitidos);
    if (selection === "both" && permitidos.length < 2) setSelection(primeiro);
    else if (selection !== "both" && !permitidos.includes(selection)) setSelection(primeiro);
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

  const baixarSelecionados = async () => { for (const formato of exibidos) await baixar(formato); };

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
          const altura = Math.round((largura * height) / width);
          const url = previewUrls[formato];
          const logo = formato === "feed" ? OFFICIAL_INSTAGRAM_TEMPLATE : formato === "story" ? OFFICIAL_INSTAGRAM_STORY_TEMPLATE : null;
          const escala = largura / width;
          return (
            <figure key={formato} className="space-y-2">
              <div className="relative overflow-hidden rounded-lg border border-border shadow-sm" style={{ width: largura, height: altura }}>
                {url ? <img src={url} alt={`Arte ${ROTULO_FORMATO[formato]}: ${entrada.title}`} width={largura} height={altura} className="block h-full w-full" /> : <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">Carregando preview…</div>}
                {logo ? <img src={logo.logoPath} alt="Logo HORA NEWS LAGUNA" width={Math.round(logo.logoWidth * escala)} height={Math.round(logo.logoHeight * escala)} className="pointer-events-none absolute object-contain" style={{ left: Math.round(logo.logoX * escala), top: Math.round(logo.logoY * escala) }} /> : null}
              </div>
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
