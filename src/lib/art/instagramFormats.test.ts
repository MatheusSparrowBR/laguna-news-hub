import { describe, expect, it } from "vitest";
import { DIMENSOES } from "./artTemplates";
import { renderizarArteSvg } from "./renderArt";

describe("Instagram art formats", () => {
  const input = {
    template: "cidade" as const,
    title: "Título de teste para a publicação",
    subtitle: "Resumo da notícia",
    imageUrl: null,
    dateLabel: "04/09/2026",
    sourceName: "Divulgação",
  };

  it("mantém as dimensões oficiais do Feed", () => {
    expect(DIMENSOES.feed).toEqual({ width: 1080, height: 1350 });
    const svg = renderizarArteSvg({ ...input, format: "feed" });
    expect(svg).toContain('width="1080" height="1350"');
    expect(svg).toContain("/branding/hora-news-laguna-logo.png");
  });

  it("gera uma composição Story própria em 1080×1920", () => {
    expect(DIMENSOES.story).toEqual({ width: 1080, height: 1920 });
    const svg = renderizarArteSvg({ ...input, format: "story" });
    expect(svg).toContain('width="1080" height="1920"');
    expect(svg).toContain("/branding/hora-news-laguna-logo.png");
    expect(svg).toContain('height="1110"');
  });
});
