import { supabase } from "@/integrations/supabase/client";
import type { ProjetoAtual } from "@/services/supabaseData";

/**
 * Resolve o projeto administrativo do usuário autenticado.
 *
 * O RPC de provisionamento continua sendo tentado, mas nunca há fallback
 * para o primeiro projeto. Isso evita que um usuário veja ou opere dados
 * de outro tenant caso o RPC esteja ausente ou falhe.
 */
export async function obterProjetoAtualSeguro(): Promise<ProjetoAtual | null> {
  try {
    const { error } = await supabase.rpc("claim_admin_project", {});
    if (error) {
      console.warn("[obterProjetoAtualSeguro] claim_admin_project falhou:", error.message);
    }
  } catch (error) {
    console.warn("[obterProjetoAtualSeguro] claim_admin_project não disponível:", error);
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) return null;

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, city, state, country, profile_name, instagram_username, active")
    .eq("owner_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
