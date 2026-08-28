import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  obterNoticias,
  obterNoticiaPorId,
  obterFontes,
  obterPublicacoes,
  obterAnalytics,
  obterConfiguracoes,
  alterarStatusNoticia,
  salvarAnaliseNoticia,
  criarFonte,
  alterarFonteAtiva,
  removerFonte,
  salvarConfiguracoes,
  salvarProjeto,
  type ProjetoAtual,
  type ConfiguracoesProjeto,
} from "./supabaseData";
import type { NewsItem, NewsStatus, Publication, Source } from "@/lib/types";

/**
 * Hooks de dados — acesso direto ao Supabase.
 */

export function useNoticias(projectId?: string) {
  return useQuery<NewsItem[]>({
    queryKey: ["noticias", projectId],
    queryFn: async () => {
      return obterNoticias(projectId!);
    },
    enabled: !!projectId,
  });
}

export function useNoticia(id: string, _projectId?: string) {
  return useQuery<NewsItem | null>({
    queryKey: ["noticia", id],
    queryFn: async () => {
      return obterNoticiaPorId(id);
    },
    enabled: !!id,
  });
}

export function useFontes(projectId?: string) {
  return useQuery<Source[]>({
    queryKey: ["fontes", projectId],
    queryFn: async () => {
      return obterFontes(projectId!);
    },
    enabled: !!projectId,
  });
}

export function usePublicacoes(projectId?: string) {
  return useQuery<Publication[]>({
    queryKey: ["publicacoes", projectId],
    queryFn: async () => {
      return obterPublicacoes(projectId!);
    },
    enabled: !!projectId,
  });
}

export function useAnalytics(projectId?: string) {
  return useQuery({
    queryKey: ["analytics", projectId],
    queryFn: async () => {
      return obterAnalytics(projectId!);
    },
    enabled: !!projectId,
  });
}

export function useConfiguracoes(projectId?: string) {
  return useQuery<ConfiguracoesProjeto | null>({
    queryKey: ["configuracoes", projectId],
    queryFn: async () => {
      return obterConfiguracoes(projectId!);
    },
    enabled: !!projectId,
  });
}

export function useAlterarStatusNoticia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: NewsStatus }) => {
      await alterarStatusNoticia(id, status);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["noticias"] });
      queryClient.invalidateQueries({ queryKey: ["noticia", vars.id] });
    },
  });
}

export function useSalvarAnaliseNoticia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (valores: { newsId: string; [key: string]: string | undefined }) => {
      const { newsId, ...rest } = valores;
      await salvarAnaliseNoticia(newsId, rest);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["noticias"] });
      queryClient.invalidateQueries({ queryKey: ["noticia", vars.newsId] });
    },
  });
}

export function useCriarFonte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (valores: { projectId: string; name: string; url: string; source_type: string; rss_url?: string | null }) => {
      await criarFonte(valores.projectId, valores);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fontes"] }),
  });
}

export function useAlterarFonteAtiva() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await alterarFonteAtiva(id, active);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fontes"] }),
  });
}

export function useRemoverFonte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => removerFonte(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fontes"] }),
  });
}

export function useSalvarConfiguracoes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, valores }: { projectId: string; valores: Partial<ConfiguracoesProjeto> }) => {
      await salvarConfiguracoes(projectId, valores);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["configuracoes"] }),
  });
}

export function useSalvarProjeto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, valores }: { projectId: string; valores: Partial<Pick<ProjetoAtual, "name" | "profile_name" | "instagram_username">> }) => {
      await salvarProjeto(projectId, valores);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projeto-atual"] }),
  });
}
