import { describe, expect, it } from "vitest";
import {
  GEOGRAPHIC_FILTER_MODE,
  GEO_FILTER_MODES,
  motivoBloqueio,
  permiteFluxoAutomatico,
  permiteInsercao,
  situacaoRevisaoInicial,
} from "./geoFilterMode";

describe("modo do filtro geográfico", () => {
  it("suporta os três modos e mantém shadow como padrão", () => {
    expect(GEO_FILTER_MODES).toEqual(["shadow", "review", "block_outside"]);
    expect(GEOGRAPHIC_FILTER_MODE).toBe("shadow");
  });

  it("shadow não bloqueia nada", () => {
    for (const d of ["local", "outside", "uncertain"] as const) {
      expect(permiteInsercao(d, "shadow")).toBe(true);
      expect(permiteFluxoAutomatico(d, "shadow")).toBe(true);
      expect(motivoBloqueio(d, "shadow")).toBeNull();
      expect(situacaoRevisaoInicial(d, "shadow")).toBe("pending");
    }
  });

  it("review insere tudo, mas só local segue automaticamente", () => {
    expect(permiteInsercao("outside", "review")).toBe(true);
    expect(permiteFluxoAutomatico("outside", "review")).toBe(false);
    expect(permiteFluxoAutomatico("uncertain", "review")).toBe(false);
    expect(permiteFluxoAutomatico("local", "review")).toBe(true);
    expect(situacaoRevisaoInicial("local", "review")).toBe("skipped");
    expect(situacaoRevisaoInicial("outside", "review")).toBe("pending");
  });

  it("block_outside barra outside e registra o motivo", () => {
    expect(permiteInsercao("outside", "block_outside")).toBe(false);
    expect(permiteInsercao("local", "block_outside")).toBe(true);
    expect(permiteInsercao("uncertain", "block_outside")).toBe(true);
    expect(motivoBloqueio("outside", "block_outside")).toContain("fora de Laguna");
    expect(motivoBloqueio("uncertain", "block_outside")).toBeNull();
  });

  it("usa o modo atual quando nenhum é informado", () => {
    expect(permiteInsercao("outside")).toBe(true);
  });
});
