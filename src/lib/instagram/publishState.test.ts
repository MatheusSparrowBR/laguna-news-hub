import { describe, expect, it } from "vitest";
import {
  chaveIdempotencia,
  decidirRetry,
  erroPermanente,
  estadoFinal,
  PUBLISH_STATES,
  RETRY_MAX_TENTATIVAS,
  transicaoPermitida,
} from "./publishState";
import { validarAsset } from "./assetValidation";

describe("máquina de estados da publicação", () => {
  it("cobre os estados exigidos", () => {
    for (const estado of [
      "draft",
      "awaiting_approval",
      "approved",
      "scheduled",
      "queued",
      "publishing",
      "published",
      "failed",
      "cancelled",
    ] as const) {
      expect(PUBLISH_STATES).toContain(estado);
    }
  });

  it("permite o caminho normal até a publicação", () => {
    expect(transicaoPermitida("draft", "awaiting_approval")).toBe(true);
    expect(transicaoPermitida("awaiting_approval", "approved")).toBe(true);
    expect(transicaoPermitida("approved", "scheduled")).toBe(true);
    expect(transicaoPermitida("scheduled", "queued")).toBe(true);
    expect(transicaoPermitida("queued", "publishing")).toBe(true);
    expect(transicaoPermitida("publishing", "published")).toBe(true);
  });

  it("bloqueia atalhos inválidos e estados finais", () => {
    expect(transicaoPermitida("draft", "published")).toBe(false);
    expect(transicaoPermitida("published", "queued")).toBe(false);
    expect(transicaoPermitida("cancelled", "queued")).toBe(false);
    expect(estadoFinal("published")).toBe(true);
    expect(estadoFinal("failed")).toBe(false);
  });

  it("repetir a mesma transição é idempotente", () => {
    expect(transicaoPermitida("published", "published")).toBe(true);
    expect(transicaoPermitida("approved", "approved")).toBe(true);
  });

  it("permite retry de falha, mas não de cancelamento", () => {
    expect(transicaoPermitida("failed", "queued")).toBe(true);
    expect(transicaoPermitida("cancelled", "publishing")).toBe(false);
  });
});

describe("retry controlado", () => {
  it("não repete erro permanente", () => {
    expect(erroPermanente("asset_not_public")).toBe(true);
    expect(decidirRetry(1, "unsupported_format").retry).toBe(false);
  });

  it("repete erro temporário com espera crescente", () => {
    const primeira = decidirRetry(1, "timeout");
    const segunda = decidirRetry(2, "timeout");
    expect(primeira.retry).toBe(true);
    expect(segunda.retry).toBe(true);
    expect(segunda.proximaTentativaEmMs!).toBeGreaterThan(primeira.proximaTentativaEmMs!);
  });

  it("para no limite de tentativas — sem loop infinito", () => {
    expect(decidirRetry(RETRY_MAX_TENTATIVAS, "timeout").retry).toBe(false);
  });
});

describe("idempotência", () => {
  it("mesma origem gera a mesma chave", () => {
    const base = { projectId: "p1", newsId: "n1", format: "feed", scheduledAt: "2026-09-04T10:00:00Z" };
    expect(chaveIdempotencia(base)).toBe(chaveIdempotencia({ ...base }));
  });

  it("origens diferentes geram chaves diferentes", () => {
    expect(chaveIdempotencia({ projectId: "p1", newsId: "n1", format: "feed" })).not.toBe(
      chaveIdempotencia({ projectId: "p1", newsId: "n2", format: "feed" }),
    );
  });
});

describe("validação do asset de publicação", () => {
  const valido = {
    publicUrl: "https://cdn.exemplo.com/arte.jpg",
    mimeType: "image/jpeg",
    width: 1080,
    height: 1350,
    fileSize: 900_000,
  };

  it("aceita asset público e válido", () => {
    expect(validarAsset(valido).ok).toBe(true);
  });

  it("recusa asset sem URL pública", () => {
    const r = validarAsset({ ...valido, publicUrl: null });
    expect(r.ok).toBe(false);
    expect(r.codigo).toBe("asset_not_public");
  });

  it("recusa http e localhost", () => {
    expect(validarAsset({ ...valido, publicUrl: "http://cdn.exemplo.com/a.jpg" }).ok).toBe(false);
    expect(validarAsset({ ...valido, publicUrl: "https://localhost/a.jpg" }).ok).toBe(false);
  });

  it("recusa formato, dimensão e tamanho fora do aceito", () => {
    expect(validarAsset({ ...valido, mimeType: "image/webp" }).codigo).toBe("unsupported_format");
    expect(validarAsset({ ...valido, width: 100, height: 100 }).codigo).toBe("invalid_dimensions");
    expect(validarAsset({ ...valido, fileSize: 20_000_000 }).codigo).toBe("invalid_media");
  });
});
