import { describe, it, expect } from "vitest";
import { parseItineraryText } from "./itinerary-parser";
import {
  JAPAN_ITINERARY_TEXT,
  JAPAN_ITINERARY_TITLE,
  EXPECTED_JAPAN_STOP_COUNT,
  EXPECTED_JAPAN_LOCATIONS,
} from "@/fixtures/japan-itinerary";

describe("parseItineraryText", () => {
  it("parses a simple one-stop-per-line itinerary", () => {
    const input = `Tokyo
Kyoto
Osaka`;

    const result = parseItineraryText(input);

    expect(result.title).toBe("My Trip");
    expect(result.stops).toHaveLength(3);
    expect(result.stops[0].name).toBe("Tokyo");
    expect(result.stops[1].name).toBe("Kyoto");
    expect(result.stops[2].name).toBe("Osaka");
  });

  it("extracts dates in DD/MM/YYYY format", () => {
    const input = `01/11/2026 - Tokyo
07/11/2026 - Kyoto`;

    const result = parseItineraryText(input);

    expect(result.stops).toHaveLength(2);
    expect(result.stops[0].name).toBe("Tokyo");
    expect(result.stops[0].dateStart).toBe("2026-11-01");
    expect(result.stops[1].name).toBe("Kyoto");
    expect(result.stops[1].dateStart).toBe("2026-11-07");
  });

  it("extracts date ranges", () => {
    const input = `1-3 Nov 2026: Tokyo
4 Nov 2026: Nikko`;

    const result = parseItineraryText(input);

    expect(result.stops).toHaveLength(2);
    expect(result.stops[0].name).toBe("Tokyo");
    expect(result.stops[0].dateStart).toBe("2026-11-01");
    expect(result.stops[0].dateEnd).toBe("2026-11-03");
    expect(result.stops[1].name).toBe("Nikko");
    expect(result.stops[1].dateStart).toBe("2026-11-04");
  });

  it("extracts notes in parentheses", () => {
    const input = `Tokyo (Explore Shibuya, Harajuku)
Kyoto (Temples, Arashiyama)`;

    const result = parseItineraryText(input);

    expect(result.stops[0].name).toBe("Tokyo");
    expect(result.stops[0].notes).toBe("Explore Shibuya, Harajuku");
    expect(result.stops[1].name).toBe("Kyoto");
    expect(result.stops[1].notes).toBe("Temples, Arashiyama");
  });

  it("handles the full Japan test case format", () => {
    const input = `Day 1-3, 1-3 Nov: Tokyo (Explore Shibuya, Harajuku, Akihabara)
Day 4, 4 Nov: Nikko (Toshogu Shrine, autumn leaves)
Day 5-6, 5-6 Nov: Hakone (Onsen, Open-Air Museum, Lake Ashi)
Day 7-9, 7-9 Nov: Kyoto (Temples, Arashiyama, Fushimi Inari)
Day 10, 10 Nov: Nara (Todai-ji, deer park)
Day 11-12, 11-12 Nov: Osaka (Dotonbori, street food, Osaka Castle)
Day 13, 13 Nov: Hiroshima (Peace Memorial, Itsukushima Shrine)
Day 14, 14 Nov: Tokyo (Departure)`;

    const result = parseItineraryText(input);

    expect(result.stops).toHaveLength(8);
    expect(result.stops[0].name).toBe("Tokyo");
    expect(result.stops[0].dateStart).toBe("2026-11-01");
    expect(result.stops[0].dateEnd).toBe("2026-11-03");
    expect(result.stops[0].notes).toBe(
      "Explore Shibuya, Harajuku, Akihabara"
    );
    expect(result.stops[3].name).toBe("Kyoto");
    expect(result.stops[3].dateStart).toBe("2026-11-07");
    expect(result.stops[3].dateEnd).toBe("2026-11-09");
    expect(result.stops[6].name).toBe("Hiroshima");
    expect(result.stops[6].dateStart).toBe("2026-11-13");
  });

  it("skips empty lines", () => {
    const input = `Tokyo

Kyoto

Osaka`;

    const result = parseItineraryText(input);
    expect(result.stops).toHaveLength(3);
  });

  it("skips # comment lines", () => {
    const input = `# Japan 2026
Day 1 (13 Nov 2026) - Tokyo Haneda - Land at HND T3 ~10:25
# ignore me
Day 2 (14 Nov 2026) - Shibuya - Explore`;

    const result = parseItineraryText(input);
    expect(result.stops).toHaveLength(2);
    expect(result.stops[0].name).toBe("Tokyo Haneda");
    expect(result.stops[1].name).toBe("Shibuya");
  });

  it("trims whitespace from location names", () => {
    const input = `  Tokyo  
  Kyoto  `;

    const result = parseItineraryText(input);
    expect(result.stops[0].name).toBe("Tokyo");
    expect(result.stops[1].name).toBe("Kyoto");
  });

  it("throws for empty input", () => {
    expect(() => parseItineraryText("")).toThrow();
    expect(() => parseItineraryText("   \n  \n  ")).toThrow();
  });

  it("handles YYYY-MM-DD date format", () => {
    const input = `2026-11-01 Tokyo
2026-11-07 Kyoto`;

    const result = parseItineraryText(input);

    expect(result.stops[0].name).toBe("Tokyo");
    expect(result.stops[0].dateStart).toBe("2026-11-01");
    expect(result.stops[1].name).toBe("Kyoto");
    expect(result.stops[1].dateStart).toBe("2026-11-07");
  });

  it("accepts a custom title", () => {
    const input = `Tokyo
Kyoto`;

    const result = parseItineraryText(input, "Japan Adventure");
    expect(result.title).toBe("Japan Adventure");
  });

  it("extracts dates in parentheses: Day X (DD Mon)", () => {
    const input = `Day 6 (18 Nov) - Travel to Osaka & Explore
Day 7 (19 Nov) - Day Trip: Kyoto`;

    const result = parseItineraryText(input);

    expect(result.stops).toHaveLength(2);
    expect(result.stops[0].dateStart).toBe("2026-11-18");
    expect(result.stops[1].dateStart).toBe("2026-11-19");
  });

  it("extracts dates from 'Day X: Location (DD Month)' format", () => {
    const input = `Day 5: Kanazawa (17 November)
Day 9: Koyasan (21 November)`;

    const result = parseItineraryText(input);

    expect(result.stops).toHaveLength(2);
    expect(result.stops[0].name).toBe("Kanazawa");
    expect(result.stops[0].dateStart).toBe("2026-11-17");
    expect(result.stops[1].name).toBe("Koyasan");
    expect(result.stops[1].dateStart).toBe("2026-11-21");
  });

  it("splits dash-separated lines into name and notes", () => {
    const input = `Day 6 (18 Nov) - Travel to Osaka & Explore - Train from Kanazawa to Osaka - Evening: street food`;

    const result = parseItineraryText(input);

    expect(result.stops[0].name).toBe("Osaka");
    expect(result.stops[0].notes).toBe(
      "Train from Kanazawa to Osaka - Evening: street food"
    );
  });

  it("extracts location from 'Day Trip: X' pattern", () => {
    const input = `Day 7 (19 Nov) - Day Trip: Kyoto - 30-minute train ride from Osaka
Day 8 (20 Nov) - Day Trip: Nara - Train from Osaka`;

    const result = parseItineraryText(input);

    expect(result.stops[0].name).toBe("Kyoto");
    expect(result.stops[1].name).toBe("Nara");
  });

  it("extracts location from 'Travel to X' pattern", () => {
    const input = `Day 10 (22 Nov) - Travel to Hiroshima & Peace Memorial - Half-day journey`;

    const result = parseItineraryText(input);
    expect(result.stops[0].name).toBe("Hiroshima");
  });

  it("extracts location from 'Return to X' pattern", () => {
    const input = `Day 12 (24 Nov) - Return to Tokyo - Shinkansen from Hiroshima`;

    const result = parseItineraryText(input);
    expect(result.stops[0].name).toBe("Tokyo");
  });

  it("extracts location from 'X exploration' pattern", () => {
    const input = `Day 2 (14 Nov) - Tokyo exploration - Pick from things to do`;

    const result = parseItineraryText(input);
    expect(result.stops[0].name).toBe("Tokyo");
  });

  it("extracts location from 'LocationName: description' in first segment", () => {
    const input = `Day 14 (26 Nov) - Tokyo: Last day - Final picks`;

    const result = parseItineraryText(input);
    expect(result.stops[0].name).toBe("Tokyo");
  });

  it("parses the PRD Japan November 2026 sample itinerary", () => {
    const result = parseItineraryText(
      JAPAN_ITINERARY_TEXT,
      JAPAN_ITINERARY_TITLE
    );

    expect(result.title).toBe(JAPAN_ITINERARY_TITLE);
    expect(result.stops).toHaveLength(EXPECTED_JAPAN_STOP_COUNT);

    EXPECTED_JAPAN_LOCATIONS.forEach((location, i) => {
      expect(result.stops[i].name).toBe(location);
    });

    expect(result.stops[0].dateStart).toBe("2026-11-01");
    expect(result.stops[0].dateEnd).toBe("2026-11-03");
    expect(result.stops[1].dateStart).toBe("2026-11-04");
    expect(result.stops[2].dateStart).toBe("2026-11-05");
    expect(result.stops[2].dateEnd).toBe("2026-11-06");
    expect(result.stops[6].dateStart).toBe("2026-11-13");
    expect(result.stops[7].dateStart).toBe("2026-11-14");

    expect(result.stops[0].notes).toContain("Shibuya");
    expect(result.stops[3].notes).toContain("Arashiyama");
    expect(result.stops[5].notes).toContain("Dotonbori");
  });

  it("handles the real-world Japan itinerary format", () => {
    const input = `Day 1 (13 Nov) - Arrival - Land at Tokyo Haneda (HND T3) ~10:25 - Travel to accommodation
Day 2 (14 Nov) - Tokyo exploration - Pick from Tokyo: Things to Do
Day 4: Japanese Alps (16 November) - Take Shinkansen from Tokyo to Omachi
Day 5: Kanazawa (17 November) - Short train ride from Toyama
Day 6 (18 Nov) - Travel to Osaka & Explore - Train from Kanazawa to Osaka
Day 7 (19 Nov) - Day Trip: Kyoto - 30-minute train ride from Osaka
Day 8 (20 Nov) - Day Trip: Nara - Train from Osaka to Nara
Day 9: Koyasan (21 November) - Scenic 90-minute journey from Osaka
Day 10 (22 Nov) - Travel to Hiroshima & Peace Memorial - Half-day journey
Day 11 (23 Nov) - Day Trip: Miyajima - Train and ferry from Hiroshima
Day 12 (24 Nov) - Return to Tokyo - Shinkansen from Hiroshima
Day 13 (25 Nov) - Tokyo exploration - November Highlight: ginkgo avenue
Day 14 (26 Nov) - Tokyo: Last day - Shopping
Day 15: Departure (27 November) - Travel to Tokyo Haneda`;

    const result = parseItineraryText(input);

    expect(result.stops).toHaveLength(14);

    expect(result.stops[0].name).toBe("Tokyo Haneda");
    expect(result.stops[0].dateStart).toBe("2026-11-13");

    expect(result.stops[1].name).toBe("Tokyo");
    expect(result.stops[1].dateStart).toBe("2026-11-14");

    expect(result.stops[2].name).toBe("Japanese Alps");
    expect(result.stops[2].dateStart).toBe("2026-11-16");

    expect(result.stops[3].name).toBe("Kanazawa");
    expect(result.stops[3].dateStart).toBe("2026-11-17");

    expect(result.stops[4].name).toBe("Osaka");
    expect(result.stops[5].name).toBe("Kyoto");
    expect(result.stops[6].name).toBe("Nara");
    expect(result.stops[7].name).toBe("Koyasan");
    expect(result.stops[8].name).toBe("Hiroshima");
    expect(result.stops[9].name).toBe("Miyajima");
    expect(result.stops[10].name).toBe("Tokyo");
    expect(result.stops[11].name).toBe("Tokyo");
    expect(result.stops[12].name).toBe("Tokyo");
    expect(result.stops[13].name).toBe("Tokyo Haneda");
  });
});
