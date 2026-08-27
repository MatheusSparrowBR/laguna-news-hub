import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NOME_DO_PERFIL } from "@/config/app";
import type { NewsItem } from "@/lib/types";

export function InstagramPreview({ noticia }: { noticia: NewsItem }) {
  return (
    <Card className="max-w-sm mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Preview do Instagram</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Header do post */}
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" />
          <span className="text-sm font-semibold text-foreground">{NOME_DO_PERFIL}</span>
        </div>

        {/* Imagem simulada (arte) */}
        <div className="aspect-square w-full rounded-md bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-6">
          <p className="text-center font-display text-lg font-bold leading-tight text-white">
            {noticia.gerado.textoArte}
          </p>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="size-5 text-foreground" />
            <MessageCircle className="size-5 text-foreground" />
            <Send className="size-5 text-foreground" />
          </div>
          <Bookmark className="size-5 text-foreground" />
        </div>

        {/* Legenda */}
        <div className="text-sm">
          <span className="font-semibold text-foreground">{NOME_DO_PERFIL}</span>{" "}
          <span className="text-foreground">{noticia.gerado.legenda}</span>
        </div>
        <p className="text-xs text-primary">{noticia.gerado.hashtags}</p>
      </CardContent>
    </Card>
  );
}
