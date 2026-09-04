import { useQuery } from "@tanstack/react-query";
import type { ProjetoAtual } from "@/services/supabaseData";
import { obterProjetoAtualSeguro } from "@/services/projectService";

export function useProject() {
  return useQuery<ProjetoAtual | null>({
    queryKey: ["projeto-atual"],
    queryFn: async () => obterProjetoAtualSeguro(),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}
