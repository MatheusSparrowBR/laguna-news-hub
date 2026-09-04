import { supabase } from "@/integrations/supabase/client";

interface PhotoCreditRow {
  photo_credit: string | null;
}

/** Lê o crédito salvo de um post existente. Usa a coluna criada pela migration. */
export async function obterCreditoFotoPost(postId: string): Promise<string> {
  const client = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: PhotoCreditRow | null; error: { message: string } | null }>;
        };
      };
    };
  };

  const { data, error } = await client
    .from("posts")
    .select("photo_credit")
    .eq("id", postId)
    .maybeSingle();

  if (error) throw new Error(`Não foi possível carregar o crédito da foto: ${error.message}`);
  return data?.photo_credit ?? "";
}
