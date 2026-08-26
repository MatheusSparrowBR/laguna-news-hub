import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";
import { NOME_DO_PERFIL } from "@/config/app";

export function Header({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string;
  descricao?: string;
  acoes?: React.ReactNode;
}) {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
        <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-0 p-0">
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <Sidebar onNavegar={() => setMenuAberto(false)} />
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg font-semibold tracking-tight text-foreground">
            {titulo}
          </h1>
          {descricao && (
            <p className="truncate text-xs text-muted-foreground sm:text-sm">{descricao}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {acoes}
          <span className="hidden rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary sm:inline">
            {NOME_DO_PERFIL}
          </span>
        </div>
      </div>
    </header>
  );
}
