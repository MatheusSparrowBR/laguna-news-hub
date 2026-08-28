import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, CIDADE_COMPLETA } from "@/config/app";
import { useAuth } from "@/hooks/useAuth";

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
  const { session, loading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [modoCriar, setModoCriar] = useState(false);

  // Detecta retorno de confirmação de email (Supabase redireciona com tokens no hash)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      toast.success("E-mail confirmado com sucesso! Faça login para continuar.");
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  // Se já estiver autenticado, vai para o dashboard
  useEffect(() => {
    if (!loading && session) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) return;
    setCarregando(true);

    try {
      if (modoCriar) {
        const { needsConfirmation } = await signUp(email, senha);
        if (needsConfirmation) {
          toast.success("Conta criada! Verifique sua caixa de entrada (e spam) para confirmar o e-mail.");
        } else {
          toast.success("Conta criada e login realizado!");
          navigate({ to: "/dashboard", replace: true });
        }
      } else {
        await signIn(email, senha);
        toast.success("Login realizado");
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao acessar";
      if (message.toLowerCase().includes("email not confirmed")) {
        toast.error("E-mail ainda não confirmado. Verifique sua caixa de entrada e spam.");
      } else {
        toast.error(message);
      }
    } finally {
      setCarregando(false);
    }
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
            <CardTitle className="text-center text-base">
              {modoCriar ? "Criar conta de administrador" : "Entrar no painel"}
            </CardTitle>
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
                  autoComplete={modoCriar ? "new-password" : "current-password"}
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={carregando || loading}>
                {carregando ? (modoCriar ? "Criando..." : "Entrando...") : modoCriar ? "Criar conta" : "Entrar"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setModoCriar((v) => !v)}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                {modoCriar ? "Já tenho uma conta" : "Criar conta de administrador"}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sem domínio? Desative "Confirm email" nas configurações de Auth do Supabase para criar contas sem confirmação.
        </p>
      </div>
    </div>
  );
}
