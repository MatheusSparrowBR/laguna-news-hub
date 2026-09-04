import { describe, expect, it } from "vitest";
import { traduzirErro } from "./errorMap";

describe("traduzirErro", () => {
  it("traduz código conhecido em mensagem amigável", () => {
    const erro = traduzirErro("not_connected");
    expect(erro.mensagem).toContain("não está conectada");
    expect(erro.classe).toBe("permanente");
  });

  it("trata 401/403 como autorização expirada", () => {
    expect(traduzirErro(null, 401).codigo).toBe("token_expired");
    expect(traduzirErro(null, 403).codigo).toBe("token_expired");
  });

  it("trata 429 como limite temporário", () => {
    const erro = traduzirErro(null, 429);
    expect(erro.codigo).toBe("rate_limited");
    expect(erro.classe).toBe("temporario");
  });

  it("trata 5xx como falha temporária", () => {
    expect(traduzirErro(null, 503).classe).toBe("temporario");
  });

  it("nunca devolve mensagem vazia para código desconhecido", () => {
    const erro = traduzirErro("algo_estranho");
    expect(erro.codigo).toBe("algo_estranho");
    expect(erro.mensagem.length).toBeGreaterThan(10);
  });
});
