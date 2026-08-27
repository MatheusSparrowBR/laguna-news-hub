import { Badge } from "@/components/ui/badge";
import type { Categoria } from "@/lib/types";

const corCategoria: Record<string, string> = {
  Urgente: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  Trânsito: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  Segurança: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  Prefeitura: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  Cidade: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  Eventos: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  Turismo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  Clima: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  Esportes: "bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300",
  Economia: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  Educação: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  Saúde: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300",
};

export function CategoryBadge({ categoria }: { categoria: Categoria | string }) {
  const classe = corCategoria[categoria] || "";
  return (
    <Badge variant="outline" className={classe}>
      {categoria}
    </Badge>
  );
}
