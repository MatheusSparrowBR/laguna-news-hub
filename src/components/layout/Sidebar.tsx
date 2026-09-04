import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { navItems } from "./navigation";
import { APP_NAME, CIDADE_COMPLETA } from "@/config/app";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import { useAuth } from "@/hooks/useAuth";

export function Sidebar({ onNavegar }: { onNavegar?: () => void }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [confirmarSaida, setConfirmarSaida] = useState(false);

  const handleSair = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-5 py-5">
        <p className="font-display text-base font-bold leading-tight text-sidebar-accent-foreground">
          {APP_NAME}
        </p>
        <p className="mt-1 text-xs text-sidebar-foreground/70">{CIDADE_COMPLETA}</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((grupo, indice) => (
          <div key={grupo.titulo ?? `grupo-${indice}`} className="mb-3 space-y-1 last:mb-0">
            {grupo.titulo ? (
              <p className="px-3 pb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {grupo.titulo}
              </p>
            ) : null}
            {grupo.itens.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavegar}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className:
                    "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--sidebar-primary)]",
                }}
              >
                <item.icone className="size-4.5 shrink-0" />
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          onClick={() => setConfirmarSaida(true)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4.5" />
          Sair
        </button>
      </div>

      <ConfirmationDialog
        aberto={confirmarSaida}
        onOpenChange={setConfirmarSaida}
        titulo="Sair da conta?"
        descricao="Você voltará para a tela de login."
        textoConfirmar="Sair"
        onConfirmar={handleSair}
      />
    </div>
  );
}
