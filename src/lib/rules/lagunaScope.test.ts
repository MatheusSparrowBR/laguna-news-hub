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

describe("refinamento: pontos de referência, regiões e fato compartilhado", () => {
  const decisao = (title: string, content = "") =>
    avaliarEscopoLaguna({ title, content }).decision;

  it("perseguição na Ponte Anita Garibaldi é LOCAL", () => {
    expect(
      decisao(
        "Perseguição termina na Ponte Anita Garibaldi com apreensão de cinco quilos de cocaína",
        "Entorpecentes seriam levados ao Rio Grande do Sul",
      ),
    ).toBe("local");
  });

  it("acidente na Ponte Anita Garibaldi é LOCAL ou UNCERTAIN", () => {
    expect(["local", "uncertain"]).toContain(decisao("Acidente na Ponte Anita Garibaldi"));
  });

  it("interdição entre Laguna e Pescaria Brava não é LOCAL automaticamente", () => {
    expect(decisao("Interdição da ponte entre Laguna e Pescaria Brava")).not.toBe("local");
  });

  it("moradores de Laguna afetados por obra em Tubarão não é OUTSIDE automático", () => {
    expect(["local", "uncertain"]).toContain(
      decisao("Moradores de Laguna são afetados por obra em Tubarão"),
    );
  });

  it("Prefeitura de Tubarão anuncia nova obra é OUTSIDE", () => {
    expect(decisao("Prefeitura de Tubarão anuncia nova obra")).toBe("outside");
  });

  it("homem de Laguna preso em Tubarão é OUTSIDE", () => {
    expect(decisao("Homem de Laguna é preso em Tubarão")).toBe("outside");
  });

  it("moradores de Cabeçuda é LOCAL", () => {
    expect(decisao("Moradores de Cabeçuda recebem nova rede de água")).toBe("local");
  });

  it("obras no Centro Histórico de Laguna é LOCAL", () => {
    expect(decisao("Obras no Centro Histórico de Laguna avançam nesta semana")).toBe("local");
  });

  it("notícia sobre a Amurel é UNCERTAIN", () => {
    expect(decisao("Conset reúne candidatos a deputado estadual da Amurel")).toBe("uncertain");
  });

  it("notícia no Planalto Norte é UNCERTAIN", () => {
    expect(
      decisao("Temporal transforma ruas de cidade de SC em tapete de granizo", "Granizo cobriu vias no Planalto Norte"),
    ).toBe("uncertain");
  });

  it("bairro ambíguo sozinho não gera LOCAL", () => {
    expect(decisao("Ação recolhe resíduos no bairro Passagem")).not.toBe("local");
  });
});

describe("entidades compostas, logradouros e municípios externos", () => {
  it("1. Ferrovia Tereza Cristina não é LOCAL apenas por 'Tereza'", () => {
    expect(decisao("Ferrovia Tereza Cristina anuncia investimento na malha ferroviária")).not.toBe(
      "local",
    );
  });

  it("2. obra no bairro Tereza, em Laguna, é LOCAL", () => {
    expect(decisao("Obra no bairro Tereza, em Laguna, entra na fase final")).toBe("local");
  });

  it("3. Rua Visconde de Barbacena, em Tubarão, não é LOCAL", () => {
    expect(decisao("Ação recolhe resíduos na Rua Visconde de Barbacena, em Tubarão")).not.toBe(
      "local",
    );
  });

  it("4. moradores do bairro Barbacena, em Laguna, é LOCAL", () => {
    expect(decisao("Moradores do bairro Barbacena, em Laguna, pedem melhorias")).toBe("local");
  });

  it("5. granizo em Braço do Norte é OUTSIDE", () => {
    expect(decisao("Granizo atinge ruas em Braço do Norte")).toBe("outside");
  });

  it("6. matéria regional citando Braço do Norte e Laguna não é OUTSIDE automático", () => {
    expect(
      decisao("Encontro regional discute saúde sobre Braço do Norte e Laguna"),
    ).not.toBe("outside");
  });

  it("7. morador de Laguna atendido em Braço do Norte não é LOCAL", () => {
    expect(
      decisao("Morador de Laguna é atendido em Braço do Norte após acidente"),
    ).not.toBe("local");
  });

  it("8. Ferrovia Tereza Cristina em Laguna é LOCAL pela localização explícita", () => {
    expect(decisao("Ferrovia Tereza Cristina inicia obras em Laguna")).toBe("local");
  });

  it("9. Ponte Anita Garibaldi, em Laguna, é LOCAL", () => {
    expect(decisao("Acidente na Ponte Anita Garibaldi, em Laguna, deixa feridos")).toBe("local");
  });

  it("10. Ponte Anita Garibaldi entre Laguna e Pescaria Brava não decide LOCAL sozinha", () => {
    expect(
      decisao("Obras na Ponte Anita Garibaldi entre Laguna e Pescaria Brava seguem"),
    ).not.toBe("local");
  });

  it("nome de bairro dentro de entidade composta é ignorado como localidade", () => {
    const r = avaliarEscopoLaguna({
      title: "Ferrovia Tereza Cristina amplia operação",
      content: "A concessionária informou novos investimentos",
    });
    expect(r.matched_localities).not.toContain("Tereza");
  });
});
