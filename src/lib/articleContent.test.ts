import { describe, expect, it } from "vitest";
import {
  buscarConteudoCompleto,
  extrairCorpoDeHtml,
  htmlParaTexto,
  mapearComLimite,
} from "./articleContent.server";

const URL_SUL = "https://www.sulagora.com.br/noticia/25565/exemplo";

const corpoLongo =
  "O fato aconteceu na tarde de ontem no bairro Portinho, em Laguna. " +
  "A Policia Militar foi acionada e encontrou o suspeito na rua principal. " +
  "Segundo o boletim, ninguem ficou ferido e o caso segue em investigacao. ";

function paginaSulAgora(corpo = corpoLongo): string {
  return `<!DOCTYPE html><html><head>
    <title>Titulo da pagina</title>
    <meta name="description" content="Lead curto do RSS com um pouco mais de texto para servir de ultimo recurso na extracao." />
    </head><body>
    <nav>Menu Home Noticias Esportes</nav>
    <div class="noticiadetalhes">
      <h1>Homem e preso no Portinho</h1>
      <h2>Subtitulo da materia</h2>
      <script>var x = 1; document.write("lixo");</script>
      <style>.a{color:red}</style>
      <p>CONTINUA DEPOIS DA PUBLICIDADE</p>
      <p>${corpo}</p>
      <p>Mais informa&ccedil;&otilde;es&nbsp;em breve.</p>
    </div>
    <div class="col2"><h3>Mais lidas</h3><p>Outra noticia em Tubarao que nao deve entrar no corpo</p></div>
    <footer>Rodape do site</footer>
    <aside>Publicidade lateral</aside>
  </body></html>`;
}

function resposta(
  body: string,
  status = 200,
  contentType = "text/html; charset=UTF-8",
): Response {
  return new Response(body, { status, headers: { "content-type": contentType } });
}

describe("extração do HTML", () => {
  it("extrai o corpo de HTML válido pelo container div.noticiadetalhes", () => {
    const r = extrairCorpoDeHtml(paginaSulAgora(), URL_SUL);
    expect(r.success).toBe(true);
    expect(r.via).toBe("fonte-especifica");
    expect(r.content).toContain("bairro Portinho");
    expect(r.title).toBe("Homem e preso no Portinho");
  });

  it("corta o conteúdo em div.col2 (sem sidebar / mais lidas)", () => {
    const r = extrairCorpoDeHtml(paginaSulAgora(), URL_SUL);
    expect(r.content).not.toContain("Mais lidas");
    expect(r.content).not.toContain("Outra noticia em Tubarao");
  });

  it("remove script, style, nav, footer e aside", () => {
    const r = extrairCorpoDeHtml(paginaSulAgora(), URL_SUL);
    const texto = r.content ?? "";
    expect(texto).not.toContain("document.write");
    expect(texto).not.toContain("color:red");
    expect(texto).not.toContain("Menu Home");
    expect(texto).not.toContain("Rodape do site");
    expect(texto).not.toContain("Publicidade lateral");
  });

  it("remove o marcador CONTINUA DEPOIS DA PUBLICIDADE", () => {
    const r = extrairCorpoDeHtml(paginaSulAgora(), URL_SUL);
    expect(r.content?.toUpperCase()).not.toContain("CONTINUA DEPOIS DA PUBLICIDADE");
  });

  it("decodifica entidades HTML e &nbsp;", () => {
    const r = extrairCorpoDeHtml(paginaSulAgora(), URL_SUL);
    expect(r.content).toContain("Mais informações em breve.");
    expect(r.content).not.toContain("&nbsp;");
  });

  it("usa <article> quando a fonte não tem extractor específico", () => {
    const html = `<html><body><article><p>${corpoLongo}</p></article></body></html>`;
    const r = extrairCorpoDeHtml(html, "https://outrosite.com/materia/1");
    expect(r.success).toBe(true);
    expect(r.via).toBe("article");
  });

  it("usa <main> quando não há article", () => {
    const html = `<html><body><main><p>${corpoLongo}</p></main></body></html>`;
    const r = extrairCorpoDeHtml(html, "https://outrosite.com/materia/2");
    expect(r.via).toBe("main");
  });

  it("usa meta description apenas como último recurso", () => {
    const html = `<html><head><meta name="description" content="Descricao razoavelmente longa da materia publicada hoje pela redacao local de Laguna." /></head><body><div>oi</div></body></html>`;
    const r = extrairCorpoDeHtml(html, "https://outrosite.com/materia/3");
    expect(r.via).toBe("meta-description");
  });

  it("falha (sem lixo de HTML) quando o corpo é curto demais", () => {
    const html = `<html><body><div class="noticiadetalhes"><p>curto</p></div></body></html>`;
    const r = extrairCorpoDeHtml(html, URL_SUL);
    expect(r.success).toBe(false);
    expect(r.content).toBeNull();
  });

  it("falha em HTML inválido", () => {
    expect(extrairCorpoDeHtml("nao é html nenhum", URL_SUL).success).toBe(false);
    expect(extrairCorpoDeHtml("", URL_SUL).reason).toBe("html-invalido");
  });

  it("htmlParaTexto preserva parágrafos", () => {
    expect(htmlParaTexto("<p>um</p><p>dois</p>")).toBe("um\ndois");
  });
});

describe("busca HTTP com fallback", () => {
  it("retorna o conteúdo em HTTP 200", async () => {
    const r = await buscarConteudoCompleto(URL_SUL, {
      fetchImpl: async () => resposta(paginaSulAgora()),
    });
    expect(r.success).toBe(true);
    expect(r.content).toContain("Portinho");
  });

  it("timeout → falha sem retry infinito e sem lançar", async () => {
    let chamadas = 0;
    const r = await buscarConteudoCompleto(URL_SUL, {
      timeoutMs: 20,
      fetchImpl: (_u, init) =>
        new Promise((_res, rej) => {
          chamadas += 1;
          (init?.signal as AbortSignal).addEventListener("abort", () => {
            const e = new Error("aborted");
            e.name = "AbortError";
            rej(e);
          });
        }),
    });
    expect(r.success).toBe(false);
    expect(r.reason).toContain("timeout");
    expect(chamadas).toBe(2); // tentativa inicial + 1 retry
  });

  it("403 → fallback imediato, sem retry", async () => {
    let chamadas = 0;
    const r = await buscarConteudoCompleto(URL_SUL, {
      fetchImpl: async () => {
        chamadas += 1;
        return resposta("", 403);
      },
    });
    expect(r.success).toBe(false);
    expect(r.reason).toBe("http-403");
    expect(chamadas).toBe(1);
  });

  it("404 → fallback imediato, sem retry", async () => {
    let chamadas = 0;
    const r = await buscarConteudoCompleto(URL_SUL, {
      fetchImpl: async () => {
        chamadas += 1;
        return resposta("", 404);
      },
    });
    expect(r.reason).toBe("http-404");
    expect(chamadas).toBe(1);
  });

  it("429 → fallback imediato, sem retry", async () => {
    let chamadas = 0;
    const r = await buscarConteudoCompleto(URL_SUL, {
      fetchImpl: async () => {
        chamadas += 1;
        return resposta("", 429);
      },
    });
    expect(r.reason).toBe("http-429");
    expect(chamadas).toBe(1);
  });

  it("500 → 1 retry e depois fallback", async () => {
    let chamadas = 0;
    const r = await buscarConteudoCompleto(URL_SUL, {
      fetchImpl: async () => {
        chamadas += 1;
        return resposta("", 500);
      },
    });
    expect(r.success).toBe(false);
    expect(chamadas).toBe(2);
  });

  it("500 seguido de 200 → sucesso no retry", async () => {
    let chamadas = 0;
    const r = await buscarConteudoCompleto(URL_SUL, {
      fetchImpl: async () => {
        chamadas += 1;
        return chamadas === 1 ? resposta("", 500) : resposta(paginaSulAgora());
      },
    });
    expect(r.success).toBe(true);
    expect(chamadas).toBe(2);
  });

  it("erro de rede → retry e fallback", async () => {
    let chamadas = 0;
    const r = await buscarConteudoCompleto(URL_SUL, {
      fetchImpl: async () => {
        chamadas += 1;
        throw new Error("ECONNRESET");
      },
    });
    expect(r.success).toBe(false);
    expect(r.reason).toContain("rede");
    expect(chamadas).toBe(2);
  });

  it("página vazia → fallback", async () => {
    const r = await buscarConteudoCompleto(URL_SUL, { fetchImpl: async () => resposta("   ") });
    expect(r.reason).toBe("pagina-vazia");
  });

  it("content-type não HTML → fallback", async () => {
    const r = await buscarConteudoCompleto(URL_SUL, {
      fetchImpl: async () => resposta("%PDF-1.4 binario", 200, "application/pdf"),
    });
    expect(r.success).toBe(false);
    expect(r.reason).toContain("content-type");
  });

  it("redirect seguido (Response final 200) → conteúdo extraído", async () => {
    const r = await buscarConteudoCompleto(URL_SUL, {
      fetchImpl: async (_u, init) => {
        expect((init as RequestInit).redirect).toBe("follow");
        return resposta(paginaSulAgora());
      },
    });
    expect(r.success).toBe(true);
  });

  it("URL inválida → fallback sem requisição", async () => {
    let chamadas = 0;
    const r = await buscarConteudoCompleto("ftp://x/y", {
      fetchImpl: async () => {
        chamadas += 1;
        return resposta("");
      },
    });
    expect(r.reason).toBe("url-invalida");
    expect(chamadas).toBe(0);
  });
});

describe("concorrência limitada", () => {
  it("nunca passa de 4 requisições simultâneas", async () => {
    let ativos = 0;
    let pico = 0;
    const itens = Array.from({ length: 11 }, (_, i) => i);
    const r = await mapearComLimite(
      itens,
      4,
      async (n) => {
        ativos += 1;
        pico = Math.max(pico, ativos);
        await new Promise((res) => setTimeout(res, 5));
        ativos -= 1;
        return n * 2;
      },
      0,
    );
    expect(pico).toBeLessThanOrEqual(4);
    expect(r).toHaveLength(11);
    expect(r[10]).toBe(20);
  });
});
