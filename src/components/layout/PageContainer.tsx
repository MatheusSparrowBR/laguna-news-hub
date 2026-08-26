import type { ReactNode } from "react";
import { Header } from "./Header";

export function PageContainer({
  titulo,
  descricao,
  acoes,
  children,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <Header titulo={titulo} descricao={descricao} acoes={acoes} />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
    </>
  );
}

export function SectionCard({
  titulo,
  acao,
  children,
}: {
  titulo: string;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="font-display text-base font-semibold text-foreground">{titulo}</h2>
        {acao}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
