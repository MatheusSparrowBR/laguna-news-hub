import { renderizarArteSvg, svgParaDataUrl, type EntradaArte } from "@/lib/art/renderArt";
import { DIMENSOES, ROTULO_FORMATO, type ArtFormat } from "@/lib/art/artTemplates";

/** Preview da mesma arte oficial usada no PNG final do feed do Instagram. */
export function ArtPreview({
  entrada,
  formatos = ["feed"],
}: {
  entrada: Omit<EntradaArte, "format">;
  formatos?: readonly ArtFormat[];
}) {
  return (
    <div className="flex flex-wrap gap-4">
      {formatos.map((formato) => {
        const svg = renderizarArteSvg({ ...entrada, format: formato });
        const { width, height } = DIMENSOES[formato];
        const largura = formato === "story" ? 150 : 360;
        return (
          <figure key={formato} className="space-y-2">
            <img
              src={svgParaDataUrl(svg)}
              alt={`Arte ${ROTULO_FORMATO[formato]}: ${entrada.title}`}
              width={largura}
              height={Math.round((largura * height) / width)}
              className="w-full max-w-[360px] rounded-lg border border-border shadow-sm"
            />
            <figcaption className="text-xs text-muted-foreground">
              {ROTULO_FORMATO[formato]} · {width}×{height}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
