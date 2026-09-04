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
  desconectarInstagram,
} from "@/lib/editorial.functions";
import {
  iniciarConexaoInstagram,
  publicarAgora,
  verificarConexaoInstagram,
} from "@/lib/instagram.functions";

/** Hooks das áreas editorial, publicações e monetização. */

type Opcional<T> = { [K in keyof T]?: T[K] | undefined };

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

const MENSAGEM_DECISAO: Record<string, string> = {
  approved: "Notícia aprovada.",
  rejected: "Notícia rejeitada.",
  review_required: "Notícia enviada para revisão.",
  archived: "Notícia arquivada.",
};

export function useDecisaoEditorial(projectId?: string) {
  const invalidar = useInvalidar(["fila-editorial", "metricas-internas", "noticias"], projectId);
  return useMutation({
    mutationFn: (entrada: {
      news_id: string;
      decision: "approved" | "rejected" | "review_required" | "archived";
      note?: string | undefined;
    }) => salvarDecisaoEditorial({ data: { project_id: projectId!, ...entrada } }),
    onSuccess: (resultado) => {
      invalidar();
      if (resultado.mudou) {
        toast.success(MENSAGEM_DECISAO[resultado.status] ?? "Situação atualizada.");
      } else {
        toast.info("Nada mudou: a notícia já estava nessa situação.");
      }
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
    onSuccess: (resultado) => {
      invalidar();
      toast.success(
        resultado.mudou ? "Localização atualizada." : "Localização mantida como estava.",
      );
    },
    onError: (erro: Error) => toast.error(erro.message),
  });
}

/**
 * Salva o post e expõe `mutate` com o contrato assíncrono esperado pelo PostComposer.
 * O resultado de `mutate` continua sendo seguro para chamadas existentes que ignoram o retorno.
 */
export function useSalvarPost(projectId?: string) {
  const invalidar = useInvalidar(["posts-projeto", "metricas-internas"], projectId);
  const mutation = useMutation({
    mutationFn: (entrada: EntradaPost & { id?: string | undefined }) => salvarPost(entrada),
    onSuccess: () => {
      invalidar();
      toast.success("Publicação salva.");
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  return {
    ...mutation,
    mutate: mutation.mutateAsync,
  };
}

export function useAlterarStatusPost(projectId?: string) {
  const invalidar = useInvalidar(["posts-projeto", "metricas-internas"], projectId);
  return useMutation({
    mutationFn: (entrada: { id: string; status: string; scheduled_at?: string | null | undefined }) =>
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
    mutationFn: (entrada: Opcional<Sponsor> & { name: string }) =>
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
    mutationFn: (entrada: Opcional<Campanha> & { sponsor_id: string; name: string }) =>
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
      id?: string | undefined;
      campaign_id: string;
      post_id?: string | null | undefined;
      scheduled_at?: string | null | undefined;
      status: string;
      notes?: string | null | undefined;
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

/* --------------------------------------------------- Instagram (conexão) */

export function useConectarInstagram(projectId?: string) {
  return useMutation({
    mutationFn: () => iniciarConexaoInstagram({ data: { project_id: projectId! } }),
    onSuccess: (resultado) => {
      // Redireciona o navegador para a autorização oficial do Instagram.
      window.location.href = resultado.url;
    },
    onError: (erro: Error) => toast.error(erro.message),
  });
}

export function useVerificarInstagram(projectId?: string) {
  const invalidar = useInvalidar(["estado-instagram"], projectId);
  return useMutation({
    mutationFn: () => verificarConexaoInstagram({ data: { project_id: projectId! } }),
    onSuccess: (resultado) => {
      invalidar();
      if (resultado.status === "connected") toast.success(resultado.mensagem);
      else toast.warning(resultado.mensagem);
    },
    onError: (erro: Error) => toast.error(erro.message),
  });
}

export function useDesconectarInstagram(projectId?: string) {
  const invalidar = useInvalidar(["estado-instagram"], projectId);
  return useMutation({
    mutationFn: () => desconectarInstagram({ data: { project_id: projectId! } }),
    onSuccess: () => {
      invalidar();
      toast.success("Instagram desconectado. Publicações e histórico foram preservados.");
    },
    onError: (erro: Error) => toast.error(erro.message),
  });
}

export function usePublicarAgora(projectId?: string) {
  const invalidar = useInvalidar(["posts", "logs-publicacao", "metricas-internas"], projectId);
  return useMutation({
    mutationFn: (entrada: { post_id: string }) =>
      publicarAgora({ data: { project_id: projectId!, post_id: entrada.post_id } }),
    onSuccess: (resultado) => {
      invalidar();
      toast.success(resultado.mensagem);
    },
    onError: (erro: Error) => toast.error(erro.message),
  });
}
