import { describe, expect, it } from "vitest";
import { diagnosticarClassificacao } from "./newsClassification";

const casos: Array<[string, string, number?]> = [
  ["Acidente na BR-101 deixa trânsito lento", "Trânsito", 7],
  ["Polícia prende suspeito em Laguna", "Segurança"],
  ["Prefeitura anuncia nova obra", "Prefeitura"],
  ["Defesa Civil alerta para chuva forte", "Clima", 7],
  ["Festival acontece neste fim de semana", "Eventos"],
  ["Hospital de Laguna amplia atendimento", "Saúde"],
  ["Time de Laguna vence campeonato", "Esportes"],
  ["Novas vagas de emprego são abertas", "Economia"],
  ["Escolas municipais iniciam matrícula", "Educação"],
  ["Praias de Laguna recebem visitantes", "Turismo"],
];

describe("classificação por regras", () => {
  for (const [titulo, categoria, minimo] of casos) {
    it(`"${titulo}" -> ${categoria}`, () => {
      const r = diagnosticarClassificacao(titulo, "");
      expect(r.categoria_prevista).toBe(categoria);
      if (minimo) expect(r.importance_score).toBeGreaterThanOrEqual(minimo);
    });
  }

  it("cai em Cidade quando nenhuma regra atinge o limiar", () => {
    const r = diagnosticarClassificacao("Nota informativa breve", "");
    expect(r.categoria_prevista).toBe("Cidade");
  });

  it("score fica entre 0 e 10", () => {
    const r = diagnosticarClassificacao(
      "Temporal causa alagamento, enchente e morte em Laguna com evacuação e alerta",
      "risco, perigo, desastre",
    );
    expect(r.importance_score).toBeLessThanOrEqual(10);
    expect(r.importance_score).toBeGreaterThanOrEqual(0);
  });

  it("é determinístico", () => {
    const a = diagnosticarClassificacao("Prefeitura de Laguna publica edital municipal", "obra pública");
    const b = diagnosticarClassificacao("Prefeitura de Laguna publica edital municipal", "obra pública");
    expect(a).toEqual(b);
  });
});

describe("ajustes de regras (token matching e combinações)", () => {
  const esperado: Array<[string, string]> = [
    ["Região pode registrar 50 mm de chuva até a madrugada de terça-feira", "Clima"],
    ["Feira livre movimenta o centro de Laguna", "Eventos"],
    ["Homem morto a facadas na região", "Segurança"],
    ["Homens são presos com 36 porções de maconha prontas para venda", "Segurança"],
    ["Acidente na BR-101 deixa trânsito lento", "Trânsito"],
    ["BR-101 interditada após colisão", "Trânsito"],
    ["Homens presos por tráfico na BR-101", "Segurança"],
    ["Treinamento contra fraudes veiculares reúne forças de segurança na BR-101", "Segurança"],
    ["Prefeitura de Laguna anuncia nova obra", "Prefeitura"],
    ["Defesa Civil alerta para chuva forte", "Clima"],
  ];

  for (const [titulo, categoria] of esperado) {
    it(`classifica "${titulo.slice(0, 45)}" como ${categoria}`, () => {
      expect(diagnosticarClassificacao(titulo, "").categoria_prevista).toBe(categoria);
    });
  }

  it('"escola" isolada não classifica como Educação', () => {
    const r = diagnosticarClassificacao("Obras de escola provocam deslizamento e Estado terá de indenizar condomínio", "");
    expect(r.categoria_prevista).not.toBe("Educação");
  });

  it('"escola" com contexto escolar classifica como Educação', () => {
    const r = diagnosticarClassificacao("Escola municipal recebe novos alunos e professores", "");
    expect(r.categoria_prevista).toBe("Educação");
  });

  it('"feira" isolada não é suficiente para Eventos', () => {
    expect(diagnosticarClassificacao("Movimento na feira do bairro", "").scores.eventos).toBeLessThan(4);
  });
});
