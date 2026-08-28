import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useModoDados } from "./dataMode";
import {
  listarNoticias,
  listarPublicacoes,
  listarFontes,
  obterEstatisticasInstagram,
  obterMetricasDiarias,
} from "./mockService";
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
 * Hooks de dados que alternam entre banco real (Lovable Cloud) e dados
 * simulados (demo), de acordo com a chave laguna:modo-dados.
 */

export function useNoticias(projectId?: string) {
  const modo = useModoDados();
  return useQuery<NewsItem[]>({
    queryKey: ["noticias", projectId, modo],
    queryFn: async () => {
      if (modo === "demo" || !projectId) return listarNoticias();
      return obterNoticias(projectId);
    },
    enabled: modo === "demo" || !!projectId,
  });
}

export function useNoticia(id: string, projectId?: string) {
  const modo = useModoDados();
  return useQuery<NewsItem | null>({
    queryKey: ["noticia", id, projectId, modo],
    queryFn: async () => {
      if (modo === "demo") return listarNoticias().find((n) => n.id === id) ?? null;
      return obterNoticiaPorId(id);
    },
    enabled: !!id,
  });
}

export function useFontes(projectId?: string) {
  const modo = useModoDados();
  return useQuery<Source[]>({
    queryKey: ["fontes", projectId, modo],
    queryFn: async () => {
      if (modo === "demo" || !projectId) return listarFontes();
      const fontes = await obterFontes(projectId);
      return fontes.map((f) => ({ ...f, tipo: f.tipo === "rss" ? "rss" : ("site" as const) }));
    },
    enabled: modo === "demo" || !!projectId,
  });
}

export function usePublicacoes(projectId?: string) {
  const modo = useModoDados();
  return useQuery<Publication[]>({
    queryKey: ["publicacoes", projectId, modo],
    queryFn: async () => {
      if (modo === "demo" || !projectId) return listarPublicacoes();
      return obterPublicacoes(projectId);
    },
    enabled: modo === "demo" || !!projectId,
  });
}

export function useAnalytics(projectId?: string) {
  const modo = useModoDados();
  return useQuery({
    queryKey: ["analytics", projectId, modo],
    queryFn: async () => {
      if (modo === "demo" || !projectId) {
        const publicacoes = listarPublicacoes();
        const metricas = obterMetricasDiarias();
        const instagram = obterEstatisticasInstagram();
        return {
          alcance: instagram.alcanceHoje,
          impressoes: instagram.impressoesHoje,
          curtidas: publicacoes.reduce((s, p) => s + p.curtidas, 0),
          comentarios: publicacoes.reduce((s, p) => s + p.comentarios, 0),
          compartilhamentos: 0,
          salvamentos: 0,
          diario: metricas,
        };
      }
      return obterAnalytics(projectId);
    },
    enabled: modo === "demo" || !!projectId,
  });
}

export function useConfiguracoes(projectId?: string) {
  const modo = useModoDados();
  return useQuery<ConfiguracoesProjeto | null>({
    queryKey: ["configuracoes", projectId, modo],
    queryFn: async () => {
      if (modo === "demo" || !projectId) {
        return {
          auto_publish_enabled: false,
          approval_required: true,
          max_posts_per_day: 6,
          minimum_confidence: 70,
          minimum_interval_minutes: 60,
        };
      }
      return obterConfiguracoes(projectId);
    },
    enabled: modo === "demo" || !!projectId,
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
