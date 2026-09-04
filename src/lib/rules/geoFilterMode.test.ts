import { describe, expect, it } from "vitest";
import {
  GEOGRAPHIC_FILTER_MODE,
  GEO_FILTER_MODES,
  motivoBloqueio,
  permiteFluxoAutomatico,
  permiteInsercao,
  situacaoRevisaoInicial,
  statusInicialNoticia,
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

describe("statusInicialNoticia", () => {
  it("shadow: tudo entra como nova", () => {
    expect(statusInicialNoticia("outside", "shadow")).toBe("new");
    expect(statusInicialNoticia("uncertain", "shadow")).toBe("new");
    expect(statusInicialNoticia("local", "shadow")).toBe("new");
  });

  it("review: não-local vai para revisão", () => {
    expect(statusInicialNoticia("local", "review")).toBe("new");
    expect(statusInicialNoticia("uncertain", "review")).toBe("review_required");
    expect(statusInicialNoticia("outside", "review")).toBe("review_required");
  });

  it("block_outside: outside não é inserida; uncertain entra em revisão", () => {
    expect(permiteInsercao("outside", "block_outside")).toBe(false);
    expect(permiteInsercao("uncertain", "block_outside")).toBe(true);
    expect(permiteInsercao("local", "block_outside")).toBe(true);
    expect(statusInicialNoticia("uncertain", "block_outside")).toBe("review_required");
    expect(motivoBloqueio("outside", "block_outside")).toContain("block_outside");
    expect(motivoBloqueio("local", "block_outside")).toBeNull();
  });
});
