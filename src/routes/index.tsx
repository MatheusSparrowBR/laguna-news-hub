import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LoadingState } from "@/components/common/LoadingState";

export const Route = createFileRoute("/")({
  component: HomeRedirect,
});

/**
 * Keep the public entry point independent from Supabase/auth initialization.
 * Authentication is resolved by /login; this prevents a Supabase configuration
 * failure from turning the application's first render into the root error page.
 */
function HomeRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/login", replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingState titulo="Carregando HORA NEWS LAGUNA..." />
    </div>
  );
}
