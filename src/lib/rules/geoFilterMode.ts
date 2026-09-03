/**
 * Modo de operação do filtro geográfico de Laguna.
 *
 * Ponto ÚNICO de configuração — não replicar essa decisão em outros arquivos.
 *
 *  - "shadow"  → apenas observa e conta; NENHUMA notícia é descartada.
 *  - "enforce" → (futuro) descartaria notícias com decisão "outside".
 *
 * Fase atual: shadow. Estamos coletando dados reais para medir a proporção de
 * local/outside/uncertain antes de decidir se "outside" será bloqueado.
 */
import type { ScopeDecision } from "./lagunaScope";

export type GeoFilterMode = "shadow" | "enforce";

export const GEOGRAPHIC_FILTER_MODE: GeoFilterMode = "shadow";

/**
 * Decide se um item pode seguir para o INSERT.
 * Em modo shadow, todas as decisões são permitidas (retorna sempre true).
 */
export function permiteInsercao(
  decision: ScopeDecision,
  mode: GeoFilterMode = GEOGRAPHIC_FILTER_MODE,
): boolean {
  if (mode === "shadow") return true;
  return decision !== "outside";
}
