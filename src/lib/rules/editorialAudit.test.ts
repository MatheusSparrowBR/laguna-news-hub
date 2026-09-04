import { describe, expect, it } from "vitest";
import { houveMudancaGeo, houveMudancaStatus } from "./editorialAudit";

describe("auditoria editorial idempotente", () => {
  it("new → review_required registra", () => {
    expect(houveMudancaStatus("new", "review_required")).toBe(true);
  });

  it("review_required → review_required não registra", () => {
    expect(houveMudancaStatus("review_required", "review_required")).toBe(false);
  });

  it("approved → approved não registra", () => {
    expect(houveMudancaStatus("approved", "approved")).toBe(false);
  });
});

describe("auditoria geográfica idempotente", () => {
  it("uncertain → local registra", () => {
    expect(houveMudancaGeo(null, "uncertain", "local")).toBe(true);
  });

  it("local → local não registra", () => {
    expect(houveMudancaGeo("local", "uncertain", "local")).toBe(false);
  });

  it("outside → uncertain registra", () => {
    expect(houveMudancaGeo("outside", "outside", "uncertain")).toBe(true);
  });

  it("sem registro anterior, primeira decisão manual registra", () => {
    expect(houveMudancaGeo(null, null, "local")).toBe(true);
  });

  it("decisão automática permanece independente da manual", () => {
    const automatica = "uncertain" as const;
    expect(houveMudancaGeo("local", automatica, "outside")).toBe(true);
    expect(automatica).toBe("uncertain");
  });
});
