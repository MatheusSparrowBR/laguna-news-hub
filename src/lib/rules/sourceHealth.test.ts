import { describe, expect, it } from "vitest";
import {
  atualizacaoFalha,
  atualizacaoSucesso,
  estadoFonte,
  extrairHttpStatus,
} from "./sourceHealth";

const AGORA = "2026-09-04T12:00:00.000Z";

describe("estadoFonte", () => {
  it("é saudável sem falhas e sem erro", () => {
    expect(estadoFonte({ consecutive_failures: 0, last_error: null })).toBe("saudavel");
  });

  it("é atenção com uma falha", () => {
    expect(estadoFonte({ consecutive_failures: 1, last_error: "HTTP 500" })).toBe("atencao");
  });

  it("é atenção quando só há erro registrado", () => {
    expect(estadoFonte({ consecutive_failures: 0, last_error: "Timeout" })).toBe("atencao");
  });

  it("é falha a partir de três falhas seguidas", () => {
    expect(estadoFonte({ consecutive_failures: 3, last_error: "HTTP 404" })).toBe("falha");
    expect(estadoFonte({ consecutive_failures: 9, last_error: null })).toBe("falha");
  });
});

describe("extrairHttpStatus", () => {
  it.each([
    ["HTTP 404", 404],
    ["HTTP 429", 429],
    ["HTTP 503 no feed", 503],
    ["Timeout após 10000ms", null],
    [null, null],
  ])("extrai %s", (mensagem, esperado) => {
    expect(extrairHttpStatus(mensagem as string | null)).toBe(esperado);
  });
});

describe("atualizacaoSucesso", () => {
  it("limpa o erro e zera as falhas", () => {
    const r = atualizacaoSucesso({ agoraIso: AGORA, encontrouNoticia: false });
    expect(r).toEqual({
      last_checked_at: AGORA,
      last_http_status: 200,
      last_error: null,
      consecutive_failures: 0,
    });
  });

  it("marca a última notícia encontrada só quando houve notícia", () => {
    const com = atualizacaoSucesso({ agoraIso: AGORA, encontrouNoticia: true });
    expect(com.last_news_found_at).toBe(AGORA);
    const sem = atualizacaoSucesso({ agoraIso: AGORA, encontrouNoticia: false });
    expect(sem.last_news_found_at).toBeUndefined();
  });
});

describe("atualizacaoFalha", () => {
  it("incrementa falhas e registra o HTTP da mensagem", () => {
    const r = atualizacaoFalha({ agoraIso: AGORA, mensagem: "HTTP 403", falhasAnteriores: 2 });
    expect(r.consecutive_failures).toBe(3);
    expect(r.last_http_status).toBe(403);
    expect(r.last_error).toBe("HTTP 403");
  });

  it("não guarda mensagem gigante", () => {
    const r = atualizacaoFalha({
      agoraIso: AGORA,
      mensagem: "x".repeat(900),
      falhasAnteriores: 0,
    });
    expect(r.last_error).toHaveLength(500);
    expect(r.last_http_status).toBeNull();
  });
});
