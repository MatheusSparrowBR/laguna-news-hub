import { describe, expect, it } from "vitest";
import {
  cortarEmPalavra,
  gerarHashtags,
  gerarLegendaPost,
  gerarTituloPost,
  HASHTAGS_MAX,
  limparTexto,
  primeirasFrases,
  templateParaNoticia,
  TITULO_POST_MAX,
} from "./postTemplates";

describe("limpeza e corte de texto", () => {
  it("remove HTML e entidades", () => {
    expect(limparTexto("<p>Praia do  Mar&nbsp;Grosso &amp; cia</p>")).toBe(
      "Praia do Mar Grosso & cia",
    );
  });

  it("nunca corta palavra ao meio", () => {
    const saida = cortarEmPalavra("Prefeitura de Laguna anuncia obras na avenida central", 30);
    expect(saida.length).toBeLessThanOrEqual(31);
    expect(saida.endsWith("…")).toBe(true);
    const palavrasOriginais = "Prefeitura de Laguna anuncia obras na avenida central".split(" ");
    const palavras = saida.replace("…", "").split(" ");
    expect(palavras.every((p, i) => p === palavrasOriginais[i])).toBe(true);
  });

  it("mantém frases completas no resumo", () => {
    const texto = "Primeira frase. Segunda frase bem maior que a primeira. Terceira.";
    expect(primeirasFrases(texto, 40)).toBe("Primeira frase.");
  });
});

describe("escolha de template", () => {
  it("usa urgente quando o score é muito alto", () => {
    expect(templateParaNoticia("transito", 9)).toBe("urgente");
  });

  it("usa a categoria quando existe", () => {
    expect(templateParaNoticia("seguranca", 5)).toBe("seguranca");
  });

  it("cai para cidade sem categoria", () => {
    expect(templateParaNoticia(null, 3)).toBe("cidade");
    expect(templateParaNoticia("inexistente", 3)).toBe("cidade");
  });
});

describe("título do post", () => {
  it("aplica prefixo por template e respeita o limite", () => {
    const titulo = gerarTituloPost({ newsTitle: "Acidente na BR-101", template: "transito" });
    expect(titulo.startsWith("🚧 TRÂNSITO:")).toBe(true);
    expect(titulo.length).toBeLessThanOrEqual(TITULO_POST_MAX + 1);
  });

  it("marca o post patrocinado com o nome do patrocinador", () => {
    const titulo = gerarTituloPost({
      newsTitle: "Promoção de inverno",
      template: "patrocinado",
      sponsorName: "Padaria Central",
    });
    expect(titulo).toContain("PUBLICIDADE");
    expect(titulo).toContain("Padaria Central");
  });

  it("não altera o título original da notícia", () => {
    const original = "Chuva forte atinge Laguna";
    gerarTituloPost({ newsTitle: original, template: "clima" });
    expect(original).toBe("Chuva forte atinge Laguna");
  });
});

describe("hashtags", () => {
  it("inclui a base e as da categoria sem duplicar", () => {
    const tags = gerarHashtags("transito", ["#Laguna", "br101"]);
    expect(tags).toContain("#Laguna");
    expect(tags).toContain("#Transito");
    expect(tags).toContain("#BR101");
    expect(new Set(tags.map((t) => t.toLowerCase())).size).toBe(tags.length);
  });

  it("não passa do limite", () => {
    const tags = gerarHashtags("clima", ["#a", "#b", "#c", "#d", "#e", "#f", "#g"]);
    expect(tags.length).toBeLessThanOrEqual(HASHTAGS_MAX);
  });
});

describe("legenda do post", () => {
  it("monta gancho, resumo, fonte, CTA e hashtags", () => {
    const legenda = gerarLegendaPost({
      newsTitle: "Defesa Civil alerta para chuva em Laguna",
      content: "A Defesa Civil emitiu alerta. A chuva deve seguir até domingo.",
      sourceName: "Sul Notícias",
      template: "clima",
    });
    expect(legenda.gancho).toContain("CLIMA");
    expect(legenda.resumo).toContain("Defesa Civil");
    expect(legenda.fonte).toBe("📰 Fonte: Sul Notícias");
    expect(legenda.cta.length).toBeGreaterThan(0);
    expect(legenda.texto.split("\n\n").length).toBe(5);
  });

  it("identifica publicidade no post patrocinado", () => {
    const legenda = gerarLegendaPost({
      newsTitle: "Semana de ofertas",
      content: "Ofertas até sábado.",
      template: "patrocinado",
      sponsorName: "Mercado Laguna",
      cta: "Visite a loja no centro.",
    });
    expect(legenda.fonte).toContain("Publicidade");
    expect(legenda.cta).toBe("Visite a loja no centro.");
  });
});
