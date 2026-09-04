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

describe("refinamento final (saúde, trânsito, economia, turismo)", () => {
  const positivos: Array<[string, string]> = [
    ["Paciente foi atendido no hospital de Laguna", "Saúde"],
    ["Rodovia tem pista interditada após acidente", "Trânsito"],
    ["Novas vagas de emprego são abertas em Laguna", "Economia"],
    ["Empresas anunciam investimentos em Laguna", "Economia"],
    ["Turistas visitam praias de Laguna", "Turismo"],
    ["Hotel registra alta ocupação durante feriado", "Turismo"],
  ];

  for (const [titulo, categoria] of positivos) {
    it(`classifica "${titulo.slice(0, 45)}" como ${categoria}`, () => {
      expect(diagnosticarClassificacao(titulo, "").categoria_prevista).toBe(categoria);
    });
  }

  it('"paciente" isolado não classifica como Saúde', () => {
    const r = diagnosticarClassificacao("Paciente participa de audiência judicial", "");
    expect(r.categoria_prevista).not.toBe("Saúde");
    expect(r.scores.saude).toBeLessThan(4);
  });

  it('"pista" isolada não classifica como Trânsito (aeroporto)', () => {
    const r = diagnosticarClassificacao(
      "Aeroporto de Jaguaruna passa por obras",
      "A pista do aeroporto será recuperada nos próximos meses.",
    );
    expect(r.categoria_prevista).not.toBe("Trânsito");
    expect(r.scores.transito).toBeLessThan(4);
  });

  it('"praia" isolada não classifica como Turismo', () => {
    const r = diagnosticarClassificacao("Obra em rua próxima à praia é retomada", "");
    expect(r.categoria_prevista).not.toBe("Turismo");
  });

  it("Prefeitura anuncia programação cultural fica em Eventos ou Prefeitura", () => {
    const r = diagnosticarClassificacao("Prefeitura anuncia programação cultural", "");
    expect(["Eventos", "Prefeitura"]).toContain(r.categoria_prevista);
  });

  it("importance_score segue determinístico e dentro de 0-10", () => {
    const a = diagnosticarClassificacao("Turistas visitam praias de Laguna", "");
    const b = diagnosticarClassificacao("Turistas visitam praias de Laguna", "");
    expect(a).toEqual(b);
    expect(a.importance_score).toBeGreaterThanOrEqual(0);
    expect(a.importance_score).toBeLessThanOrEqual(10);
  });
});


describe('ajuste pontual: "empresa" contextual', () => {
  it('"empresa" isolada não classifica como Economia', () => {
    const r = diagnosticarClassificacao(
      "Empresa responsável pela obraна rua é notificada pela prefeitura".replace("на", " "),
      "A empresa terá prazo para concluir o serviço no bairro.",
    );
    expect(r.categoria_prevista).not.toBe("Economia");
  });

  it('"empresa de ônibus" não classifica como Economia', () => {
    const r = diagnosticarClassificacao("Empresa de ônibus altera horários de linha", "");
    expect(r.categoria_prevista).not.toBe("Economia");
    expect(r.scores.economia).toBeLessThan(4);
  });

  it('"empresas" com contexto econômico continua Economia', () => {
    expect(
      diagnosticarClassificacao("Empresas anunciam investimentos em Laguna", "").categoria_prevista,
    ).toBe("Economia");
  });

  it("vagas de emprego seguem em Economia", () => {
    expect(
      diagnosticarClassificacao("Novas vagas de emprego são abertas em Laguna", "").categoria_prevista,
    ).toBe("Economia");
  });

  it("categorias sensíveis não regridem", () => {
    const casos: Array<[string, string]> = [
      ["Homem morto a facadas na região", "Segurança"],
      ["Acidente na BR-101 deixa trânsito lento", "Trânsito"],
      ["Defesa Civil alerta para chuva forte", "Clima"],
      ["Paciente foi atendido no hospital de Laguna", "Saúde"],
      ["Festival acontece neste fim de semana", "Eventos"],
    ];
    for (const [titulo, esperado] of casos) {
      expect(diagnosticarClassificacao(titulo, "").categoria_prevista).toBe(esperado);
    }
  });
});
