import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/**
 * Server Function de diagnóstico temporário.
 * Verifica se a request chega ao servidor e se o header Authorization está presente.
 * NÃO acessa banco, OpenAI, nem retorna dados sensíveis.
 */
export const debugServerAuth = createServerFn({ method: "POST" })
  .handler(async (): Promise<{
    requestReachedServer: boolean;
    authorizationHeaderPresent: boolean;
    authenticated: boolean;
    diagnosticNotes: string;
  }> => {
    let authorizationHeaderPresent = false;
    let authenticated = false;
    let diagnosticNotes = "";

    try {
      const request = getRequest();

      if (!request?.headers) {
        diagnosticNotes = "getRequest() retornou sem headers";
        return {
          requestReachedServer: true,
          authorizationHeaderPresent: false,
          authenticated: false,
          diagnosticNotes,
        };
      }

      const authHeader = request.headers.get("authorization");

      if (!authHeader) {
        diagnosticNotes = "Header Authorization AUSENTE na request do servidor";
        return {
          requestReachedServer: true,
          authorizationHeaderPresent: false,
          authenticated: false,
          diagnosticNotes,
        };
      }

      authorizationHeaderPresent = true;

      if (!authHeader.startsWith("Bearer ")) {
        diagnosticNotes = "Header Authorization presente mas NÃO é Bearer";
        return {
          requestReachedServer: true,
          authorizationHeaderPresent: true,
          authenticated: false,
          diagnosticNotes,
        };
      }

      const token = authHeader.replace("Bearer ", "");

      if (!token || token.split(".").length !== 3) {
        diagnosticNotes = "Token presente mas formato inválido (não é JWT)";
        return {
          requestReachedServer: true,
          authorizationHeaderPresent: true,
          authenticated: false,
          diagnosticNotes,
        };
      }

      // Validar token com Supabase
      const SUPABASE_URL = process.env["SUPABASE_URL"];
      const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];

      if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
        diagnosticNotes = "Token presente e formato JWT válido, mas variáveis SUPABASE_URL/SUPABASE_PUBLISHABLE_KEY ausentes no servidor para validação";
        return {
          requestReachedServer: true,
          authorizationHeaderPresent: true,
          authenticated: false,
          diagnosticNotes,
        };
      }

      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data?.user) {
        diagnosticNotes = `Token presente, formato JWT válido, mas validação falhou: ${error?.message ?? "user não retornado"}`;
        return {
          requestReachedServer: true,
          authorizationHeaderPresent: true,
          authenticated: false,
          diagnosticNotes,
        };
      }

      authenticated = true;
      diagnosticNotes = "Token válido, usuário autenticado com sucesso";

      return {
        requestReachedServer: true,
        authorizationHeaderPresent: true,
        authenticated: true,
        diagnosticNotes,
      };
    } catch (err: any) {
      return {
        requestReachedServer: true,
        authorizationHeaderPresent,
        authenticated,
        diagnosticNotes: `Erro inesperado: ${err?.message ?? "desconhecido"}`,
      };
    }
  });
