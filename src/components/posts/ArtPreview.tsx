import { useEffect, useMemo, useState } from "react";
import { renderizarArteSvg, svgParaBlobUrl, type EntradaArte } from "@/lib/art/renderArt";
import { DIMENSOES, ROTULO_FORMATO, type ArtFormat } from "@/lib/art/artTemplates";

/** Preview da mesma arte oficial usada no PNG final do feed do Instagram. */
export function ArtPreview({
  entrada,
  formatos = ["feed"],
}: {
  entrada: Omit<EntradaArte, "format">;
  formatos?: readonly ArtFormat[];
}) {
  const svgs = useMemo(
    () => formatos.map((formato) => ({ formato, svg: renderizarArteSvg({ ...entrada, format: formato }) })),
    [entrada, formatos],
  );
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const urls = Object.fromEntries(
      svgs.map(({ formato, svg }) => [formato, svgParaBlobUrl(svg)]),
    );
    setPreviewUrls(urls);

    return () => {
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [svgs]);

  return (
    <div className="flex flex-wrap gap-4">
      {svgs.map(({ formato }) => {
        const { width, height } = DIMENSOES[formato];
        const largura = formato === "story" ? 150 : 300;
        const url = previewUrls[formato];
        return (
          <figure key={formato} className="space-y-2">
            {url ? (
              <img
                src={url}
                alt={`Arte ${ROTULO_FORMATO[formato]}: ${entrada.title}`}
                width={largura}
                height={Math.round((largura * height) / width)}
                className="w-full max-w-[300px] rounded-lg border border-border shadow-sm"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex aspect-[4/5] w-full max-w-[300px] items-center justify-center rounded-lg border border-border bg-muted text-xs text-muted-foreground"
              >
                Carregando preview…
              </div>
            )}
            <figcaption className="text-xs text-muted-foreground">
              {ROTULO_FORMATO[formato]} · {width}×{height}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
