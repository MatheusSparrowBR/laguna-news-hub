import { Outlet, createFileRoute, redirect, Link } from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useProject } from "@/hooks/useProject";
import { LoadingState } from "@/components/common/LoadingState";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { isLoading, error } = useProject();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingState titulo="Carregando painel..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-foreground">Não foi possível carregar o projeto.</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button asChild>
          <Link to="/login">Voltar ao login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar />
      </aside>
      <div className="lg:pl-64">
        <Outlet />
      </div>
    </div>
  );
}
