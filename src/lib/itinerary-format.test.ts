import { describe, it, expect } from "vitest";
import {
  ITINERARY_FORMAT_EXAMPLE,
  ITINERARY_FORMAT_RULES,
  itineraryFormatPlainText,
} from "./itinerary-format";
import { parseItineraryText } from "@/services/itinerary-parser";

describe("itinerary format guide", () => {
  it("documents the main rules agents and humans need", () => {
    const titles = ITINERARY_FORMAT_RULES.map((r) => r.title);
    expect(titles).toEqual(
      expect.arrayContaining([
        "One stop per line",
        "Optional title comment",
        "Dates",
        "Day prefixes",
        "Notes",
        "Times",
      ])
    );
  });

  it("includes a pasteable example the parser accepts", () => {
    const parsed = parseItineraryText(ITINERARY_FORMAT_EXAMPLE);
    expect(parsed.stops.length).toBeGreaterThanOrEqual(4);
    expect(parsed.stops[0].name).toMatch(/Tokyo|Haneda/i);
    expect(parsed.stops.some((s) => s.dateStart)).toBe(true);
  });

  it("renders a plain-text guide for agents", () => {
    const text = itineraryFormatPlainText();
    expect(text).toContain("Tourister itinerary format");
    expect(text).toContain(ITINERARY_FORMAT_EXAMPLE.trim());
    expect(text).toMatch(/POST \/api\/parse/);
    expect(text).toContain("One stop per line");
  });
});
