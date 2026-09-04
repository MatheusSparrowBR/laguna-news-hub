/**
 * Guarda das credenciais do Instagram — SERVER-ONLY.
 *
 * A tabela public.social_account_credentials só é acessível pela chave de
 * serviço (RLS habilitada, sem policy para anon/authenticated). O token NUNCA
 * é devolvido ao navegador, nem registrado em log, nem gravado em
 * social_accounts.
 */
import { criarClienteAdmin } from "@/lib/adminClient.server";

const PROVIDER = "instagram";

export async function salvarToken(entrada: {
  projectId: string;
  accessToken: string;
  expiresAt: string | null;
}): Promise<void> {
  const admin = criarClienteAdmin();
  const { error } = await admin.from("social_account_credentials").upsert(
    {
      project_id: entrada.projectId,
      provider: PROVIDER,
      access_token: entrada.accessToken,
      token_type: "bearer",
      expires_at: entrada.expiresAt,
    },
    { onConflict: "project_id,provider" },
  );
  if (error) throw new Error("Não foi possível guardar a autorização do Instagram.");
}

export async function obterToken(
  projectId: string,
): Promise<{ accessToken: string; expiresAt: string | null } | null> {
  const admin = criarClienteAdmin();
  const { data } = await admin
    .from("social_account_credentials")
    .select("access_token, expires_at")
    .eq("project_id", projectId)
    .eq("provider", PROVIDER)
    .maybeSingle();
  if (!data) return null;
  return { accessToken: data.access_token, expiresAt: data.expires_at };
}

export async function apagarToken(projectId: string): Promise<void> {
  const admin = criarClienteAdmin();
  await admin
    .from("social_account_credentials")
    .delete()
    .eq("project_id", projectId)
    .eq("provider", PROVIDER);
}
