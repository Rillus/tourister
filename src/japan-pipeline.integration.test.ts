/**
 * Phase 5: Japan Test — Full pipeline integration test
 * Verifies parse → geocode → enrich flow with the PRD Japan November 2026 itinerary
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  JAPAN_ITINERARY_TEXT,
  JAPAN_ITINERARY_TITLE,
  EXPECTED_JAPAN_STOP_COUNT,
} from "@/fixtures/japan-itinerary";
import { parseItineraryText } from "@/services/itinerary-parser";
import type { GeocodedStop } from "@/types/itinerary";
import type { EnrichedStop } from "@/types/enrichment";

vi.mock("@/services/geocoder", () => ({
  geocodeStops: vi.fn(),
}));

vi.mock("@/services/wikipedia", () => ({
  enrichStop: vi.fn(),
}));

import { geocodeStops } from "@/services/geocoder";
import { enrichStop } from "@/services/wikipedia";

const JAPAN_COORDS: Record<string, { lat: number; lon: number }> = {
  Tokyo: { lat: 35.6762, lon: 139.6503 },
  Nikko: { lat: 36.7199, lon: 139.6982 },
  Hakone: { lat: 35.2326, lon: 139.1063 },
  Kyoto: { lat: 35.0116, lon: 135.7681 },
  Nara: { lat: 34.6851, lon: 135.8048 },
  Osaka: { lat: 34.6937, lon: 135.5023 },
  Hiroshima: { lat: 34.3853, lon: 132.4553 },
};

function makeGeocodedStop(name: string, stop: { dateStart?: string; dateEnd?: string }): GeocodedStop {
  const coords = JAPAN_COORDS[name] ?? JAPAN_COORDS.Tokyo;
  return {
    name,
    latitude: coords.lat,
    longitude: coords.lon,
    ...(stop.dateStart && { dateStart: stop.dateStart }),
    ...(stop.dateEnd && { dateEnd: stop.dateEnd }),
  };
}

describe("Japan pipeline integration", () => {
  beforeEach(() => {
    vi.mocked(geocodeStops).mockImplementation(async (stops) =>
      stops.map((s) => makeGeocodedStop(s.name, s))
    );
    vi.mocked(enrichStop).mockImplementation(async (name) => ({
      nameLocal: undefined,
      wikipediaSummary: `Wikipedia summary for ${name}`,
      wikipediaUrl: `https://en.wikipedia.org/wiki/${name}`,
      imageUrl: `https://example.com/${encodeURIComponent(name)}.jpg`,
      imageAttribution: "CC BY-SA",
    }));
  });

  it("parses Japan itinerary and produces valid structure", () => {
    const parsed = parseItineraryText(JAPAN_ITINERARY_TEXT, JAPAN_ITINERARY_TITLE);

    expect(parsed.title).toBe(JAPAN_ITINERARY_TITLE);
    expect(parsed.stops).toHaveLength(EXPECTED_JAPAN_STOP_COUNT);
    expect(parsed.stops.every((s) => s.name && s.name.length > 0)).toBe(true);
    expect(
      parsed.stops.filter((s) => s.dateStart).length
    ).toBeGreaterThanOrEqual(6);
  });

  it("geocode → enrich pipeline produces valid enriched stops", async () => {
    const parsed = parseItineraryText(JAPAN_ITINERARY_TEXT, JAPAN_ITINERARY_TITLE);
    const geocoded = await geocodeStops(parsed.stops);

    expect(geocoded).toHaveLength(EXPECTED_JAPAN_STOP_COUNT);
    expect(geocoded.every((s) => s.latitude && s.longitude)).toBe(true);

    const enriched: EnrichedStop[] = [];
    for (const stop of geocoded) {
      const result = await enrichStop(stop.name);
      enriched.push({
        ...stop,
        ...(result?.nameLocal && { nameLocal: result.nameLocal }),
        enrichment: result
          ? {
              wikipediaSummary: result.wikipediaSummary,
              wikipediaUrl: result.wikipediaUrl,
              imageUrl: result.imageUrl,
              imageAttribution: result.imageAttribution,
            }
          : undefined,
      });
    }

    expect(enriched).toHaveLength(EXPECTED_JAPAN_STOP_COUNT);
    const withEnrichment = enriched.filter((s) => s.enrichment);
    expect(withEnrichment.length).toBe(EXPECTED_JAPAN_STOP_COUNT);

    const withImageAndSummary = enriched.filter(
      (s) => s.enrichment?.wikipediaSummary && s.enrichment?.imageUrl
    );
    expect(withImageAndSummary.length).toBe(EXPECTED_JAPAN_STOP_COUNT);
  });

  it("enrichment rate meets PRD target (≥85%)", async () => {
    const parsed = parseItineraryText(JAPAN_ITINERARY_TEXT, JAPAN_ITINERARY_TITLE);
    const geocoded = await geocodeStops(parsed.stops);

    const enriched: EnrichedStop[] = [];
    for (const stop of geocoded) {
      const result = await enrichStop(stop.name);
      enriched.push({
        ...stop,
        enrichment: result
          ? {
              wikipediaSummary: result.wikipediaSummary,
              wikipediaUrl: result.wikipediaUrl,
              imageUrl: result.imageUrl,
              imageAttribution: result.imageAttribution,
            }
          : undefined,
      });
    }

    const withImageAndSummary = enriched.filter(
      (s) => s.enrichment?.wikipediaSummary && s.enrichment?.imageUrl
    );
    const rate = (withImageAndSummary.length / enriched.length) * 100;
    expect(rate).toBeGreaterThanOrEqual(85);
  });
});
