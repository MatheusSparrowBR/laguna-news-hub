import { describe, it, expect, vi } from "vitest";
import {
  executarPreviewNoticia,
  executarPreviewLote,
  PREVIEW_MAX_LOTE,
  type EntradaPreview,
} from "./pipelinePreview.server";
import * as pipeline from "./pipelinePreview.server";

const PAGINA = (corpo: string) =>
  `<html><body><div class="noticiadetalhes"><p>${corpo}</p></div><div class="col2">mais lidas</div></body></html>`;

function respostaHtml(corpo: string, status = 200): Response {
  return new Response(PAGINA(corpo), {
    status,
    headers: { "content-type": "text/html; charset=UTF-8" },
  });
}

const BASE: EntradaPreview = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Acidente na BR-101",
  original_content: "Colisão registrada nesta manhã.",
  source_url: "https://sulagora.com.br/noticia/1",
  source_name: "Sul Notícias",
  categoria_atual: "Cidade",
  importance_atual: 5,
};

const CORPO_LONGO =
  "O acidente aconteceu no bairro Magalhães, em Laguna, na manhã de quinta-feira. " +
  "Segundo a Polícia Militar de Laguna, duas pessoas ficaram feridas e foram levadas " +
  "ao hospital municipal de Laguna. O trânsito ficou lento por mais de uma hora no " +
  "trecho urbano de Laguna, próximo ao centro histórico da cidade de Laguna.";

describe("executarPreviewNoticia", () => {
  it("sucesso: usa conteúdo completo e reporta status/tempo", async () => {
    const fetchImpl = vi.fn(async () => respostaHtml(CORPO_LONGO)) as unknown as typeof fetch;
    let t = 1000;
    const r = await executarPreviewNoticia(BASE, {
      fetchImpl,
      agora: () => (t += 40),
    });

    expect(r.fetch_status).toBe("success");
    expect(r.conteudo_usado).toBe("COMPLETO");
    expect(r.http_status).toBe(200);
    expect(r.fetch_ms).toBeGreaterThan(0);
    expect(r.full_chars).toBeGreaterThan(200);
    expect(r.rss_chars).toBe(BASE.original_content!.length);
    expect(r.com_full).not.toBeNull();
    expect(r.final).toBe(r.com_full);
    expect(r.categoria_atual).toBe("Cidade");
    expect(r.importance_atual).toBe(5);
  });

  it("fallback RSS: corpo curto demais mantém a avaliação do RSS", async () => {
    const fetchImpl = vi.fn(async () => respostaHtml("texto curto")) as unknown as typeof fetch;
    const r = await executarPreviewNoticia(BASE, { fetchImpl });

    expect(r.fetch_status).toBe("fallback-rss");
    expect(r.conteudo_usado).toBe("RSS");
    expect(r.full_chars).toBe(0);
    expect(r.com_full).toBeNull();
    expect(r.final).toBe(r.com_rss);
  });

  it("erro HTTP: 404 marca error e não faz retry", async () => {
    const fetchImpl = vi.fn(async () => new Response("nao encontrado", { status: 404 })) as unknown as typeof fetch;
    const r = await executarPreviewNoticia(BASE, { fetchImpl });

    expect(r.fetch_status).toBe("error");
    expect(r.http_status).toBe(404);
    expect(r.fetch_reason).toBe("http-404");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(r.final).toBe(r.com_rss);
  });

  it("notícia sem source_url: não busca nada", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const r = await executarPreviewNoticia({ ...BASE, source_url: null }, { fetchImpl });

    expect(r.fetch_status).toBe("error");
    expect(r.fetch_reason).toBe("sem-source-url");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("conteúdo vazio: página em branco cai em fallback", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response("   ", { status: 200, headers: { "content-type": "text/html" } }),
    ) as unknown as typeof fetch;
    const r = await executarPreviewNoticia({ ...BASE, original_content: "" }, { fetchImpl });

    expect(r.full_chars).toBe(0);
    expect(r.rss_chars).toBe(0);
    expect(r.com_full).toBeNull();
  });

  it("nunca lança quando a rede falha", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("ECONNRESET");
    }) as unknown as typeof fetch;
    const r = await executarPreviewNoticia(BASE, { fetchImpl, maxRetries: 0 });
    expect(r.fetch_status).toBe("error");
  });
});

describe("executarPreviewLote", () => {
  const entradas: EntradaPreview[] = Array.from({ length: 12 }, (_, i) => ({
    ...BASE,
    id: `1111111${i}-1111-1111-1111-111111111111`,
    source_url: `https://sulagora.com.br/noticia/${i}`,
  }));

  it("limita a 10 itens e respeita concorrência 4", async () => {
    let ativos = 0;
    let pico = 0;
    const fetchImpl = vi.fn(async () => {
      ativos += 1;
      pico = Math.max(pico, ativos);
      await new Promise((r) => setTimeout(r, 5));
      ativos -= 1;
      return respostaHtml(CORPO_LONGO);
    }) as unknown as typeof fetch;

    const r = await executarPreviewLote(entradas, { fetchImpl });

    expect(r.itens).toHaveLength(PREVIEW_MAX_LOTE);
    expect(pico).toBeLessThanOrEqual(4);
    expect(r.resumo.total).toBe(10);
  });

  it("conta transições uncertain → local", async () => {
    const fetchImpl = vi.fn(async () => respostaHtml(CORPO_LONGO)) as unknown as typeof fetch;
    const r = await executarPreviewLote(entradas.slice(0, 2), { fetchImpl });
    const soma =
      r.resumo.uncertain_para_local +
      r.resumo.uncertain_para_outside +
      r.resumo.uncertain_para_uncertain;
    expect(soma).toBeLessThanOrEqual(r.resumo.total);
  });
});

describe("invariante: preview não altera o banco", () => {
  it("o módulo não importa cliente de banco nem executa mutations", async () => {
    const fonte = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("./pipelinePreview.server.ts", import.meta.url), "utf8"),
    );

    for (const proibido of [
      "supabase",
      "adminClient",
      "createClient",
      ".insert(",
      ".update(",
      ".delete(",
      ".upsert(",
      "openai",
      "OPENAI",
    ]) {
      expect(fonte.toLowerCase()).not.toContain(proibido.toLowerCase());
    }
  });

  it("expõe apenas funções de leitura", () => {
    expect(Object.keys(pipeline).sort()).toEqual(
      ["PREVIEW_CONCORRENCIA", "PREVIEW_MAX_LOTE", "executarPreviewLote", "executarPreviewNoticia"].sort(),
    );
  });
});
