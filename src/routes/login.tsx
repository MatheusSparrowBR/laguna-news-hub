import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Newspaper } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, CIDADE_COMPLETA } from "@/config/app";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login | Projeto Notícias Laguna" },
      {
        name: "description",
        content: "Acesse o painel administrativo do perfil de notícias de Laguna.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);

    // Simula login
    setTimeout(() => {
      setCarregando(false);
      toast.success("Login realizado (simulado)");
      navigate({ to: "/dashboard" });
    }, 800);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-primary">
            <Newspaper className="size-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{CIDADE_COMPLETA}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-base">Entrar no painel</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={carregando}>
                {carregando ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Login simulado — qualquer e-mail e senha funcionam.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
