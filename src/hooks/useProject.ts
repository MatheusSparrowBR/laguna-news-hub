import { useQuery } from "@tanstack/react-query";
import { obterProjetoAtual, type ProjetoAtual } from "@/services/supabaseData";

export function useProject() {
  return useQuery<ProjetoAtual | null>({
    queryKey: ["projeto-atual"],
    queryFn: async () => {
      const projeto = await obterProjetoAtual();
      return projeto;
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}
