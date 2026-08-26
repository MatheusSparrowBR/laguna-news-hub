import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/common/Modal";
import { APP_NAME, CIDADE_COMPLETA } from "@/config/app";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar | Projeto Notícias Laguna" },
      {
        name: "description",
        content:
          "Acesse o painel administrativo do Projeto Notícias Laguna para gerenciar notícias e publicações.",
      },
      { property: "og:title", content: "Entrar | Projeto Notícias Laguna" },
      {
        property: "og:description",
        content: "Painel administrativo de notícias locais de Laguna - SC.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [recuperarAberto, setRecuperarAberto] = useState(false);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-primary">
            {APP_NAME}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Painel administrativo · {CIDADE_COMPLETA}
          </p>
        </div>

        <form
          className="mt-8 space-y-5 rounded-xl border border-border bg-card p-6 shadow-card sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/dashboard" });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="admin@exemplo.com" autoComplete="email" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Checkbox id="lembrar" />
              <Label htmlFor="lembrar" className="text-sm font-normal text-muted-foreground">
                Lembrar acesso
              </Label>
            </div>
            <button
              type="button"
              onClick={() => setRecuperarAberto(true)}
              className="text-sm font-medium text-primary hover:underline"
            >
              Recuperar senha
            </button>
          </div>

          <Button type="submit" className="w-full">
            Entrar
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Autenticação real será ativada em uma próxima etapa.
          </p>
        </form>
      </div>

      <Modal
        aberto={recuperarAberto}
        onOpenChange={setRecuperarAberto}
        titulo="Recuperar senha"
        descricao="Informe seu e-mail para receber as instruções de recuperação."
        rodape={
          <Button onClick={() => setRecuperarAberto(false)}>Enviar instruções</Button>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="email-recuperar">E-mail</Label>
          <Input id="email-recuperar" type="email" placeholder="admin@exemplo.com" />
          <p className="text-xs text-muted-foreground">
            Envio de e-mail ainda não implementado nesta etapa.
          </p>
        </div>
      </Modal>
    </main>
  );
}
