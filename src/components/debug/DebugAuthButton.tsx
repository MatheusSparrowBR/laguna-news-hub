import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { debugServerAuth } from "@/lib/debugAuth.functions";
import { ShieldCheck } from "lucide-react";

export function DebugAuthButton() {
  const [resultado, setResultado] = useState<{
    requestReachedServer: boolean;
    authorizationHeaderPresent: boolean;
    authenticated: boolean;
    diagnosticNotes: string;
  } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const executar = async () => {
    setLoading(true);
    setErro(null);
    setResultado(null);

    try {
      const res = await debugServerAuth();
      setResultado(res);
    } catch (err: any) {
      setErro(err?.message ?? "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-dashed border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
          <ShieldCheck className="size-4" />
          Diagnóstico de Autenticação (temporário)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={executar}
          disabled={loading}
          variant="outline"
          size="sm"
          className="border-yellow-500 text-yellow-700 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-950"
        >
          {loading ? "Diagnosticando..." : "Diagnosticar autenticação"}
        </Button>

        {erro && (
          <div className="rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400">
            <p className="font-medium">ERRO NA CHAMADA:</p>
            <p>{erro}</p>
          </div>
        )}

        {resultado && (
          <div className="rounded-md bg-background border p-3 text-sm space-y-1 font-mono">
            <p>
              REQUEST:{" "}
              <span className={resultado.requestReachedServer ? "text-green-600" : "text-red-600"}>
                {resultado.requestReachedServer ? "CHEGOU" : "NÃO CHEGOU"}
              </span>
            </p>
            <p>
              AUTHORIZATION HEADER:{" "}
              <span className={resultado.authorizationHeaderPresent ? "text-green-600" : "text-red-600"}>
                {resultado.authorizationHeaderPresent ? "PRESENTE" : "AUSENTE"}
              </span>
            </p>
            <p>
              AUTHENTICATED:{" "}
              <span className={resultado.authenticated ? "text-green-600" : "text-red-600"}>
                {resultado.authenticated ? "SIM" : "NÃO"}
              </span>
            </p>
            <p className="pt-2 text-muted-foreground text-xs break-words">
              {resultado.diagnosticNotes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
