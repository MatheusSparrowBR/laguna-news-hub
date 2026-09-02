import { describe, expect, it } from "vitest";
import { avaliarEscopoLaguna } from "./lagunaScope";

const d = (title: string, content = "", source = "") =>
  avaliarEscopoLaguna({ title, content, source }).decision;

describe("filtro geográfico de Laguna", () => {
  it("1. Prefeitura de Laguna anuncia nova obra → local", () => {
    expect(d("Prefeitura de Laguna anuncia nova obra")).toBe("local");
  });

  it("2. obras em localidade confirmada (Portinho) → local", () => {
    expect(d("Obras começam no bairro Portinho")).toBe("local");
  });

  it("3. moradores de localidade confirmada → local", () => {
    expect(d("Moradores do Portinho recebem nova pavimentação")).toBe("local");
  });

  it("4. Prefeitura de Tubarão anuncia nova obra → outside", () => {
    expect(d("Prefeitura de Tubarão anuncia nova obra")).toBe("outside");
  });

  it("5. Acidente em Tubarão deixa trânsito lento → outside", () => {
    expect(d("Acidente em Tubarão deixa trânsito lento")).toBe("outside");
  });

  it("6. Homem de Laguna é preso em Tubarão → outside", () => {
    expect(d("Homem de Laguna é preso em Tubarão")).toBe("outside");
  });

  it("7. Acidente em Tubarão afeta moradores de Laguna → uncertain", () => {
    expect(d("Acidente em Tubarão afeta moradores de Laguna")).toBe("uncertain");
  });

  it("8. notícia regional sem município definido → uncertain", () => {
    expect(d("Região pode registrar 50 mm de chuva até terça-feira")).toBe("uncertain");
  });

  it("9. sem a palavra Laguna, mas com bairro confirmado → local", () => {
    expect(d("Rua do Portinho recebe nova iluminação")).toBe("local");
  });

  it("10. Praias de Laguna recebem visitantes → local", () => {
    expect(d("Praias de Laguna recebem visitantes")).toBe("local");
  });

  it("11. Prefeitura de Laguna anuncia evento → local", () => {
    expect(d("Prefeitura de Laguna anuncia evento")).toBe("local");
  });

  it("fonte oficial do município é sinal muito forte", () => {
    expect(
      d("Nota oficial sobre o municipal de futebol", "", "https://laguna.sc.gov.br/nota"),
    ).toBe("local");
  });

  it("não usa ausência de Laguna como outside", () => {
    expect(d("Homem morre após cair em tacho de banha fervente em SC")).toBe("uncertain");
  });

  it("matching é por palavra inteira (não substring)", () => {
    expect(d("Alerta de chuva até terça-feira")).toBe("uncertain");
  });

  it("é determinístico", () => {
    const a = avaliarEscopoLaguna({ title: "Prefeitura de Laguna anuncia obra" });
    const b = avaliarEscopoLaguna({ title: "Prefeitura de Laguna anuncia obra" });
    expect(a).toEqual(b);
  });
});
