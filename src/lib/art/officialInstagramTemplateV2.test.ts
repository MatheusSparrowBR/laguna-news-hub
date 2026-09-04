import { describe, expect, it } from "vitest";
import { renderOfficialInstagramSvg, OFFICIAL_INSTAGRAM_TEMPLATE } from "./officialInstagramTemplateV2";
import { renderOfficialInstagramStorySvg, OFFICIAL_INSTAGRAM_STORY_TEMPLATE } from "./officialInstagramStoryTemplate";

describe("official Instagram art", () => {
  it("uses fixed feed dimensions and the official PNG logo configuration", () => {
    const svg = renderOfficialInstagramSvg({ template: "cidade", title: "Notícia de Laguna", imageUrl: "https://example.com/photo.jpg", dateLabel: "04/09/2026", location: "Laguna - SC", photoCredit: "Divulgação" });
    expect(svg).toContain('width="1080" height="1350"');
    expect(OFFICIAL_INSTAGRAM_TEMPLATE.logoPath).toBe("/branding/hora-news-laguna-logo.png");
    expect(OFFICIAL_INSTAGRAM_TEMPLATE.logoX).toBe(825);
    expect(OFFICIAL_INSTAGRAM_TEMPLATE.logoY).toBe(1150);
    expect(svg).not.toContain("hora-news-laguna-logo.svg");
    expect(svg).toContain("#0B3D91");
    expect(svg).toContain("#FFC107");
  });

  it("uses fixed story dimensions and the official PNG logo configuration", () => {
    const svg = renderOfficialInstagramStorySvg({ template: "cidade", title: "Notícia de Laguna", dateLabel: "04/09/2026" });
    expect(svg).toContain('width="1080" height="1920"');
    expect(OFFICIAL_INSTAGRAM_STORY_TEMPLATE.logoPath).toBe("/branding/hora-news-laguna-logo.png");
    expect(OFFICIAL_INSTAGRAM_STORY_TEMPLATE.logoX).toBe(770);
    expect(OFFICIAL_INSTAGRAM_STORY_TEMPLATE.logoY).toBe(1670);
    expect(svg).not.toContain("hora-news-laguna-logo.svg");
  });

  it("keeps long titles inside both official renderers", () => {
    const title = "Uma notícia muito importante sobre trânsito e mobilidade urbana em Laguna que precisa caber no padrão oficial";
    const feed = renderOfficialInstagramSvg({ template: "transito", title, summary: "Resumo editorial curto e legível.", dateLabel: "04/09/2026" });
    const story = renderOfficialInstagramStorySvg({ template: "transito", title, summary: "Resumo editorial curto e legível.", dateLabel: "04/09/2026" });
    expect(feed.startsWith("<svg")).toBe(true);
    expect(feed.endsWith("</svg>")).toBe(true);
    expect(story.startsWith("<svg")).toBe(true);
    expect(story.endsWith("</svg>")).toBe(true);
  });
});
