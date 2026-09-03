import { describe, expect, it } from "vitest";
import { GEOGRAPHIC_FILTER_MODE, permiteInsercao } from "./geoFilterMode";
import { avaliarEscopoLaguna } from "./lagunaScope";

describe("modo do filtro geográfico", () => {
  it("a fase atual é shadow", () => {
    expect(GEOGRAPHIC_FILTER_MODE).toBe("shadow");
  });

  it("LOCAL → INSERT permitido", () => {
    expect(permiteInsercao("local")).toBe(true);
  });

  it("OUTSIDE → INSERT permitido no modo shadow", () => {
    expect(permiteInsercao("outside")).toBe(true);
  });

  it("UNCERTAIN → INSERT permitido no modo shadow", () => {
    expect(permiteInsercao("uncertain")).toBe(true);
  });

  it("nenhuma decisão real é convertida em rejeição no modo shadow", () => {
    const casos = [
      { title: "Prefeitura de Laguna anuncia nova obra", content: "" },
      { title: "Prefeitura de Tubarão anuncia nova obra", content: "" },
      { title: "SC tem alerta para chuva intensa", content: "Defesa Civil alerta o estado" },
    ];
    for (const caso of casos) {
      const { decision } = avaliarEscopoLaguna({ ...caso, source: "sulagora.com.br" });
      expect(permiteInsercao(decision)).toBe(true);
    }
  });

  it("em enforce (fase futura, não ativa) outside seria bloqueado", () => {
    expect(permiteInsercao("outside", "enforce")).toBe(false);
    expect(permiteInsercao("uncertain", "enforce")).toBe(true);
    expect(permiteInsercao("local", "enforce")).toBe(true);
  });
});
