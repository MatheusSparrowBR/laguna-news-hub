import { supabase } from "@/integrations/supabase/client";

interface PhotoCreditRow {
  photo_credit: string | null;
}

type PostsClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: PhotoCreditRow | null; error: { message: string } | null }>;
      };
    };
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

const client = supabase as unknown as PostsClient;

/** Lê o crédito salvo de um post existente. */
export async function obterCreditoFotoPost(postId: string): Promise<string> {
  const { data, error } = await client.from("posts").select("photo_credit").eq("id", postId).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.photo_credit ?? "";
}

/** Salva o crédito manualmente. Retorna false em ambientes que ainda não aplicaram a migration. */
export async function salvarCreditoFotoPost(postId: string, photoCredit: string | null): Promise<boolean> {
  const { error } = await client.from("posts").update({ photo_credit: photoCredit }).eq("id", postId);
  return !error;
}
