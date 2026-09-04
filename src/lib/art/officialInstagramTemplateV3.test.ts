import { describe, expect, it } from "vitest";
import { OFFICIAL_INSTAGRAM_TEMPLATE, renderOfficialInstagramSvg } from "./officialInstagramTemplateV3";

describe("official Instagram template v3", () => {
  it("keeps the feed at 1080×1350 and uses the supplied image as the base", () => {
    const svg = renderOfficialInstagramSvg({
      template: "cidade",
      title: "Travessias noturnas no Canal da Barra serão mantidas até outubro",
      summary: "Serviço aquaviário continuará operando, mas poderá ser temporariamente interrompido em caso de mau tempo.",
      imageUrl: "/uploads/teste.jpg",
      dateLabel: "04/09/2026",
      location: "Laguna - SC",
      photoCredit: "Prefeitura de Laguna",
    });

    expect(svg).toContain('width="1080" height="1350"');
    expect(svg).toContain('preserveAspectRatio="xMidYMid slice"');
    expect(svg).toContain("Prefeitura de Laguna");
    expect(svg).toContain("INFORMAÇÃO QUE");
    expect(svg).toContain("CONECTA NOSSA CIDADE");
    expect(svg).not.toContain("filter=");
  });

  it("preserves the fixed official branding position", () => {
    expect(OFFICIAL_INSTAGRAM_TEMPLATE.logoPath).toBe("/branding/hora-news-laguna-logo.png");
    expect(OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarX).toBe(36);
    expect(OFFICIAL_INSTAGRAM_TEMPLATE.brandingBarY).toBe(1180);
  });
});
