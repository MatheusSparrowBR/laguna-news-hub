import { useEffect, useMemo, useState } from "react";
import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { NOME_DO_PERFIL } from "@/config/app";
import { renderizarArteSvg, svgParaBlobUrl } from "@/lib/art/renderArt";
import { OFFICIAL_INSTAGRAM_TEMPLATE } from "@/lib/art/officialInstagramTemplateV2";
import type { EntradaArte } from "@/lib/art/renderArt";
import type { ArtFormat } from "@/lib/art/artTemplates";

/**
 * Preview da publicação usando a arte real e a mesma assinatura oficial usada
 * no Post Composer. A logo PNG é uma camada HTML para evitar problemas de href
 * local quando o SVG é renderizado como Blob URL.
 */
export function PostInstagramPreview({
  arte,
  legenda,
  formato = "feed",
}: {
  arte: Omit<EntradaArte, "format">;
  legenda: string;
  formato?: ArtFormat;
}) {
  const svg = useMemo(() => renderizarArteSvg({ ...arte, format: formato }), [arte, formato]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = svgParaBlobUrl(svg);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [svg]);

  const logo = formato === "feed" ? OFFICIAL_INSTAGRAM_TEMPLATE : null;
  const escala = logo ? 1 : 0;

  return (
    <Card className="mx-auto max-w-sm">
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" />
          <span className="text-sm font-semibold text-foreground">{NOME_DO_PERFIL}</span>
        </div>

        <div className="relative w-full overflow-hidden rounded-md border border-border">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`Arte da publicação: ${arte.title}`}
              className="block w-full"
            />
          ) : (
            <div className="aspect-[4/5] flex items-center justify-center text-sm text-muted-foreground">Carregando prévia…</div>
          )}
          {logo ? (
            <img
              src={logo.logoPath}
              alt="Logo HORA NEWS LAGUNA"
              className="pointer-events-none absolute object-contain"
              style={{
                left: `${logo.logoX / (logo.width ?? OFFICIAL_INSTAGRAM_TEMPLATE.width) * 100}%`,
                top: `${logo.logoY / OFFICIAL_INSTAGRAM_TEMPLATE.height * 100}%`,
                width: `${(logo.logoWidth / OFFICIAL_INSTAGRAM_TEMPLATE.width) * 100}%`,
                height: `${(logo.logoHeight / OFFICIAL_INSTAGRAM_TEMPLATE.height) * 100}%`,
              }}
            />
          ) : null}
          <span className="sr-only">Escala do logo: {escala}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="size-5 text-foreground" />
            <MessageCircle className="size-5 text-foreground" />
            <Send className="size-5 text-foreground" />
          </div>
          <Bookmark className="size-5 text-foreground" />
        </div>

        <p className="whitespace-pre-line text-sm text-foreground">
          <span className="font-semibold">{NOME_DO_PERFIL}</span> {legenda}
        </p>
      </CardContent>
    </Card>
  );
}
