import { renderizarArteSvg, svgParaDataUrl, type EntradaArte } from "@/lib/art/renderArt";
import { DIMENSOES, ROTULO_FORMATO, type ArtFormat } from "@/lib/art/artTemplates";

/**
 * Preview real da arte: renderiza o mesmo SVG que será exportado.
 * Não usa imagem falsa nem mock.
 */
export function ArtPreview({
  entrada,
  formatos = ["feed", "square", "story"],
}: {
  entrada: Omit<EntradaArte, "format">;
  formatos?: readonly ArtFormat[];
}) {
  return (
    <div className="flex flex-wrap gap-4">
      {formatos.map((formato) => {
        const svg = renderizarArteSvg({ ...entrada, format: formato });
        const { width, height } = DIMENSOES[formato];
        const largura = formato === "story" ? 150 : 200;
        return (
          <figure key={formato} className="space-y-2">
            <img
              src={svgParaDataUrl(svg)}
              alt={`Arte ${ROTULO_FORMATO[formato]}: ${entrada.title}`}
              width={largura}
              height={Math.round((largura * height) / width)}
              className="rounded-lg border border-border shadow-sm"
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
