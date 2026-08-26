import { cn } from "@/lib/utils";
import type { Categoria } from "@/lib/types";
import { NOME_DO_PERFIL } from "@/config/app";

/**
 * Placeholder visual da arte da publicação.
 * Nesta etapa não há geração real de imagem: é apenas uma simulação.
 */
export function ArtePreview({
  categoria,
  texto,
  className,
}: {
  categoria: Categoria;
  texto: string;
  className?: string;
}) {
  const urgente = categoria === "Urgente" || categoria === "Clima" || categoria === "Segurança";

  return (
    <div
      style={{
        backgroundImage: urgente
          ? "linear-gradient(150deg, var(--destructive) 0%, var(--primary) 100%)"
          : "linear-gradient(150deg, var(--primary) 0%, var(--primary) 60%, var(--sidebar-primary) 100%)",
      }}
      className={cn(
        "relative flex aspect-square w-full flex-col justify-between overflow-hidden rounded-lg p-5 text-white",
        className,
      )}
    >
      <span className="w-fit rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
        {categoria}
      </span>
      <p className="whitespace-pre-line font-display text-xl font-bold leading-tight sm:text-2xl">
        {texto || "Texto da arte ainda não definido"}
      </p>
      <span className="text-xs font-medium text-white/80">{NOME_DO_PERFIL}</span>
    </div>
  );
}
