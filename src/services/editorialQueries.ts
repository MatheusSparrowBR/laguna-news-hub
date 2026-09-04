import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  alterarStatusPost,
  marcarAvisoLido,
  obterAvisos,
  obterCampanhas,
  obterEntregas,
  obterFilaEditorial,
  obterLogsPublicacao,
  obterMetricasInternas,
  obterPatrocinadores,
  obterPosts,
  salvarCampanha,
  salvarEntrega,
  salvarPatrocinador,
  salvarPost,
  type Campanha,
  type EntradaPost,
  type Sponsor,
} from "./editorialData";
import {
  salvarDecisaoEditorial,
  salvarOverrideGeografico,
  obterEstadoInstagram,
} from "@/lib/editorial.functions";

/** Hooks das áreas editorial, publicações e monetização. */

export function useFilaEditorial(projectId?: string) {
  return useQuery({
    queryKey: ["fila-editorial", projectId],
    queryFn: () => obterFilaEditorial(projectId!),
    enabled: !!projectId,
  });
}

export function usePostsProjeto(projectId?: string) {
  return useQuery({
    queryKey: ["posts-projeto", projectId],
    queryFn: () => obterPosts(projectId!),
    enabled: !!projectId,
  });
}

export function usePatrocinadores(projectId?: string) {
  return useQuery({
    queryKey: ["patrocinadores", projectId],
    queryFn: () => obterPatrocinadores(projectId!),
    enabled: !!projectId,
  });
}

export function useCampanhas(projectId?: string) {
  return useQuery({
    queryKey: ["campanhas", projectId],
    queryFn: () => obterCampanhas(projectId!),
    enabled: !!projectId,
  });
}

export function useEntregas(projectId?: string) {
  return useQuery({
    queryKey: ["entregas", projectId],
    queryFn: () => obterEntregas(projectId!),
    enabled: !!projectId,
  });
}

export function useAvisos(projectId?: string) {
  return useQuery({
    queryKey: ["avisos", projectId],
    queryFn: () => obterAvisos(projectId!),
    enabled: !!projectId,
  });
}

export function useLogsPublicacao(projectId?: string) {
  return useQuery({
    queryKey: ["logs-publicacao", projectId],
    queryFn: () => obterLogsPublicacao(projectId!),
    enabled: !!projectId,
  });
}

export function useMetricasInternas(projectId?: string) {
  return useQuery({
    queryKey: ["metricas-internas", projectId],
    queryFn: () => obterMetricasInternas(projectId!),
    enabled: !!projectId,
  });
}

export function useEstadoInstagram(projectId?: string) {
  return useQuery({
    queryKey: ["estado-instagram", projectId],
    queryFn: () => obterEstadoInstagram({ data: { project_id: projectId! } }),
    enabled: !!projectId,
  });
}

function useInvalidar(chaves: string[], projectId?: string) {
  const queryClient = useQueryClient();
  return () => {
    for (const chave of chaves) {
      void queryClient.invalidateQueries({ queryKey: [chave, projectId] });
    }
  };
}

export function useDecisaoEditorial(projectId?: string) {
  const invalidar = useInvalidar(["fila-editorial", "metricas-internas", "noticias"], projectId);
  return useMutation({
    mutationFn: (entrada: {
      news_id: string;
      decision: "approved" | "rejected" | "review_required" | "archived";
      note?: string;
    }) => salvarDecisaoEditorial({ data: { project_id: projectId!, ...entrada } }),
    onSuccess: () => {
      invalidar();
      toast.success("Decisão registrada.");
    },
    onError: (erro: Error) => toast.error(erro.message),
  });
}

export function useOverrideGeografico(projectId?: string) {
  const invalidar = useInvalidar(["fila-editorial", "metricas-internas"], projectId);
  return useMutation({
    mutationFn: (entrada: {
      news_id: string;
      manual_decision: "local" | "outside" | "uncertain";
      review_notes?: string | undefined;
    }) => salvarOverrideGeografico({ data: { project_id: projectId!, ...entrada } }),
    onSuccess: () => {
      invalidar();
      toast.success("Revisão geográfica salva.");
    },
    onError: (erro: Error) => toast.error(erro.message),
  });
}

export function useSalvarPost(projectId?: string) {
  const invalidar = useInvalidar(["posts-projeto", "metricas-internas"], projectId);
  return useMutation({
    mutationFn: (entrada: EntradaPost & { id?: string }) => salvarPost(entrada),
    onSuccess: () => {
      invalidar();
      toast.success("Publicação salva.");
    },
    onError: (erro: Error) => toast.error(erro.message),
  });
}

export function useAlterarStatusPost(projectId?: string) {
  const invalidar = useInvalidar(["posts-projeto", "metricas-internas"], projectId);
  return useMutation({
    mutationFn: (entrada: { id: string; status: string; scheduled_at?: string | null }) =>
      alterarStatusPost(entrada.id, entrada.status, entrada.scheduled_at),
    onSuccess: () => {
      invalidar();
      toast.success("Publicação atualizada.");
    },
    onError: (erro: Error) => toast.error(erro.message),
  });
}

export function useSalvarPatrocinador(projectId?: string) {
  const invalidar = useInvalidar(["patrocinadores"], projectId);
  return useMutation({
    mutationFn: (entrada: Partial<Sponsor> & { name: string }) =>
      salvarPatrocinador({ ...entrada, project_id: projectId! }),
    onSuccess: () => {
      invalidar();
      toast.success("Patrocinador salvo.");
    },
    onError: (erro: Error) => toast.error(erro.message),
  });
}

export function useSalvarCampanha(projectId?: string) {
  const invalidar = useInvalidar(["campanhas", "metricas-internas"], projectId);
  return useMutation({
    mutationFn: (entrada: Partial<Campanha> & { sponsor_id: string; name: string }) =>
      salvarCampanha({ ...entrada, project_id: projectId! }),
    onSuccess: () => {
      invalidar();
      toast.success("Campanha salva.");
    },
    onError: (erro: Error) => toast.error(erro.message),
  });
}

export function useSalvarEntrega(projectId?: string) {
  const invalidar = useInvalidar(["entregas", "metricas-internas"], projectId);
  return useMutation({
    mutationFn: (entrada: {
      id?: string;
      campaign_id: string;
      post_id?: string | null;
      scheduled_at?: string | null;
      status: string;
      notes?: string | null;
    }) => salvarEntrega(entrada),
    onSuccess: () => {
      invalidar();
      toast.success("Entrega salva.");
    },
    onError: (erro: Error) => toast.error(erro.message),
  });
}

export function useMarcarAvisoLido(projectId?: string) {
  const invalidar = useInvalidar(["avisos"], projectId);
  return useMutation({
    mutationFn: (id: string) => marcarAvisoLido(id),
    onSuccess: invalidar,
    onError: (erro: Error) => toast.error(erro.message),
  });
}
