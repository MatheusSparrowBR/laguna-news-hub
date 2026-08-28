import { useQuery } from "@tanstack/react-query";
import { obterProjetoAtual } from "@/services/supabaseData";

export function useProject(enabled = true) {
  return useQuery({
    queryKey: ["projeto-atual"],
    queryFn: obterProjetoAtual,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
