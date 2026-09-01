/**
 * Cliente Supabase privilegiado para execuções automatizadas (server-only).
 *
 * Aceita SUPABASE_SECRET_KEY (chave nova) ou SUPABASE_SERVICE_ROLE_KEY,
 * conforme o que o ambiente disponibiliza. Nunca use no frontend.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function ehChaveNova(valor: string): boolean {
  return valor.startsWith("sb_publishable_") || valor.startsWith("sb_secret_");
}

export function criarClienteAdmin() {
  const url = process.env["SUPABASE_URL"];
  const chave = process.env["SUPABASE_SECRET_KEY"] ?? process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !chave) {
    throw new Error(
      "Variáveis do backend ausentes: SUPABASE_URL e SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  return createClient<Database>(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (ehChaveNova(chave) && headers.get("Authorization") === `Bearer ${chave}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", chave);
        return fetch(input, { ...init, headers });
      },
    },
  });
}
