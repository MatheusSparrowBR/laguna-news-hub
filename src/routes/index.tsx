import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { LoadingState } from "@/components/common/LoadingState";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  component: HomeRedirect,
});

function HomeRedirect() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    void navigate({ to: session ? "/dashboard" : "/login", replace: true });
  }, [loading, navigate, session]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingState titulo="Carregando HORA NEWS LAGUNA..." />
    </div>
  );
}
