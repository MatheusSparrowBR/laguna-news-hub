import { describe, expect, it } from "vitest";
import { renderOfficialInstagramSvg } from "./officialInstagramTemplateV2";

describe("official Instagram art", () => {
  it("uses the fixed feed dimensions and official logo", () => {
    const svg = renderOfficialInstagramSvg({ template: "cidade", title: "Notícia de Laguna", imageUrl: "https://example.com/photo.jpg", dateLabel: "04 SET 2026", location: "Laguna - SC", photoCredit: "Divulgação" });
    expect(svg).toContain('width="1080" height="1350"');
    expect(svg).toContain("/branding/hora-news-laguna-logo.svg");
    expect(svg).toContain("#0B3D91");
    expect(svg).toContain("#FFC107");
  });

  it("keeps long titles inside the renderer", () => {
    const svg = renderOfficialInstagramSvg({ template: "transito", title: "Uma notícia muito importante sobre trânsito e mobilidade urbana em Laguna que precisa caber no padrão oficial", summary: "Resumo editorial curto e legível.", dateLabel: "04 SET 2026" });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
  });
});
