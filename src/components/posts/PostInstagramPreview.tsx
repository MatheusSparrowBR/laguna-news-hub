import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { NOME_DO_PERFIL } from "@/config/app";
import { renderizarArteSvg, svgParaDataUrl } from "@/lib/art/renderArt";
import type { EntradaArte } from "@/lib/art/renderArt";
import type { ArtFormat } from "@/lib/art/artTemplates";

/**
 * Preview da publicação usando a arte real (o mesmo SVG que será exportado)
 * e a legenda real. Nada é simulado.
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
  const svg = renderizarArteSvg({ ...arte, format: formato });

  return (
    <Card className="mx-auto max-w-sm">
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" />
          <span className="text-sm font-semibold text-foreground">{NOME_DO_PERFIL}</span>
        </div>

        <img
          src={svgParaDataUrl(svg)}
          alt={`Arte da publicação: ${arte.title}`}
          className="w-full rounded-md border border-border"
        />

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
