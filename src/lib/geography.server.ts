/**
 * Persistência da decisão geográfica (server-only).
 *
 * A decisão AUTOMÁTICA nunca é apagada: um override editorial grava
 * manual_decision e mantém decision como registro histórico auditável.
 *
 * Não faz backfill: só grava para notícias recém-inseridas ou por ação humana.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { ResultadoEscopo, ScopeDecision } from "@/lib/rules/lagunaScope";
import {
  GEOGRAPHIC_FILTER_MODE,
  situacaoRevisaoInicial,
  type GeoFilterMode,
} from "@/lib/rules/geoFilterMode";

type Cliente = SupabaseClient<Database>;

export interface RegistroGeografico {
  news_id: string;
  decision: ScopeDecision;
  score: number;
  matched_localities: string[];
  matched_entities: string[];
  excluded_localities: string[];
  reason: string;
  source_mode: GeoFilterMode;
  review_status: "pending" | "reviewed" | "skipped";
}

export function montarRegistroGeografico(
  newsId: string,
  escopo: ResultadoEscopo,
  mode: GeoFilterMode = GEOGRAPHIC_FILTER_MODE,
): RegistroGeografico {
  return {
    news_id: newsId,
    decision: escopo.decision,
    score: escopo.score,
    matched_localities: escopo.matched_localities,
    matched_entities: escopo.matched_entities,
    excluded_localities: escopo.excluded_localities,
    reason: escopo.reason,
    source_mode: mode,
    review_status: situacaoRevisaoInicial(escopo.decision, mode),
  };
}

/**
 * Grava (ou reaproveita) a análise geográfica de UMA notícia nova.
 * news_id é UNIQUE: repetir a operação não duplica registro (idempotente).
 */
export async function registrarDecisaoGeografica(
  supabase: Cliente,
  registro: RegistroGeografico,
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase
    .from("news_geography")
    .upsert(registro, { onConflict: "news_id" });
  return { ok: !error, error: error?.message ?? null };
}
