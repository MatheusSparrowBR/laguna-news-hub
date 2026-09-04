import { describe, expect, it } from "vitest";
import { ajustarTexto, calcularCover, quebrarLinhas } from "./textFit";
import { ART_TEMPLATES, DIMENSOES, SAFE_AREA } from "./artTemplates";
import { escaparXml, renderizarArteSvg, svgParaDataUrl } from "./renderArt";
import { TEMPLATE_KEYS } from "@/lib/templates/postTemplates";

describe("ajuste de texto", () => {
  it("quebra linhas sem cortar palavra", () => {
    const linhas = quebrarLinhas("Prefeitura de Laguna anuncia mutirão de limpeza", 300, 60);
    expect(linhas.length).toBeGreaterThan(1);
    expect(linhas.join(" ")).toBe("Prefeitura de Laguna anuncia mutirão de limpeza");
  });

  it("reduz a fonte até caber na caixa", () => {
    const ajustado = ajustarTexto("Título bem grande para caber em pouco espaço disponível", {
      larguraMax: 400,
      alturaMax: 200,
      fontSizeInicial: 90,
      fontSizeMinimo: 30,
    });
    expect(ajustado.fontSize).toBeLessThan(90);
    expect(ajustado.alturaTotal).toBeLessThanOrEqual(200);
    expect(ajustado.truncado).toBe(false);
  });

  it("trunca quando nem o tamanho mínimo cabe — texto nunca sai da arte", () => {
    const ajustado = ajustarTexto("palavra ".repeat(80), {
      larguraMax: 300,
      alturaMax: 120,
      fontSizeInicial: 60,
      fontSizeMinimo: 40,
    });
    expect(ajustado.truncado).toBe(true);
    expect(ajustado.alturaTotal).toBeLessThanOrEqual(120);
    expect(ajustado.linhas.at(-1)?.endsWith("…")).toBe(true);
  });

  it("texto vazio não gera linhas", () => {
    const ajustado = ajustarTexto("   ", {
      larguraMax: 500,
      alturaMax: 500,
      fontSizeInicial: 50,
      fontSizeMinimo: 20,
    });
    expect(ajustado.linhas).toEqual([]);
  });

  it("cover preenche a caixa e centraliza o excedente", () => {
    const r = calcularCover(2000, 1000, { x: 0, y: 0, width: 1080, height: 1350 });
    expect(r.width).toBeGreaterThanOrEqual(1080);
    expect(r.height).toBeGreaterThanOrEqual(1350);
    expect(r.x).toBeLessThanOrEqual(0);
  });
});

describe("templates de arte", () => {
  it("existe um tema para cada template, incluindo patrocinado", () => {
    for (const key of TEMPLATE_KEYS) {
      expect(ART_TEMPLATES[key]).toBeTruthy();
      expect(ART_TEMPLATES[key].label.length).toBeGreaterThan(0);
    }
    expect(TEMPLATE_KEYS.length).toBe(13);
  });

  it("apenas o urgente tem selo de urgência", () => {
    expect(ART_TEMPLATES.urgente.urgent).toBe(true);
    expect(ART_TEMPLATES.cidade.urgent).toBe(false);
  });
});

describe("render SVG", () => {
  it("escapa caracteres perigosos", () => {
    expect(escaparXml('a & <b> "c"')).toBe("a &amp; &lt;b&gt; &quot;c&quot;");
  });

  it("gera SVG nas três dimensões", () => {
    for (const format of ["feed", "square", "story"] as const) {
      const svg = renderizarArteSvg({
        template: "cidade",
        format,
        title: "Laguna recebe nova iluminação no centro histórico",
        sourceName: "Sul Notícias",
        dateLabel: "04/09/2026",
      });
      const { width, height } = DIMENSOES[format];
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).toContain(`width="${width}"`);
      expect(svg).toContain(`height="${height}"`);
      expect(svg).toContain(`x="${SAFE_AREA}"`);
    }
  });

  it("marca publicidade quando há patrocinador", () => {
    const svg = renderizarArteSvg({
      template: "patrocinado",
      format: "feed",
      title: "Ofertas da semana",
      sponsorName: "Mercado Laguna",
    });
    expect(svg).toContain("PUBLICIDADE • Mercado Laguna");
    expect(svg).toContain("Conteúdo publicitário");
  });

  it("funciona com e sem imagem", () => {
    const comImagem = renderizarArteSvg({
      template: "clima",
      format: "feed",
      title: "Chuva forte",
      imageUrl: "https://exemplo.com/foto.jpg",
    });
    expect(comImagem).toContain("<image");
    const semImagem = renderizarArteSvg({ template: "clima", format: "feed", title: "Chuva forte" });
    expect(semImagem).not.toContain("<image");
  });

  it("gera data URL utilizável no preview", () => {
    const svg = renderizarArteSvg({ template: "cidade", format: "square", title: "Teste" });
    expect(svgParaDataUrl(svg).startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
  });
});
