import { describe, it, expect } from "vitest";
import {
  scorePOI,
  rankSuggestions,
  detectSeasonalTags,
} from "./suggestion-engine";
import type { OverpassPOI } from "./overpass";

function makePOI(overrides: Partial<OverpassPOI> = {}): OverpassPOI {
  return {
    osmId: 1,
    name: "Test Place",
    latitude: 35.0,
    longitude: 135.0,
    category: "experiences",
    distanceMetres: 500,
    tags: {},
    ...overrides,
  };
}

describe("scorePOI", () => {
  it("gives higher score to closer POIs", () => {
    const near = makePOI({ distanceMetres: 100 });
    const far = makePOI({ distanceMetres: 900 });

    const nearScore = scorePOI(near, 1000);
    const farScore = scorePOI(far, 1000);

    expect(nearScore).toBeGreaterThan(farScore);
  });

  it("gives higher score to culture/history POIs than generic experiences", () => {
    const culture = makePOI({
      category: "culture_and_history",
      distanceMetres: 500,
    });
    const generic = makePOI({
      category: "experiences",
      distanceMetres: 500,
    });

    expect(scorePOI(culture, 1000)).toBeGreaterThan(
      scorePOI(generic, 1000)
    );
  });

  it("boosts score for seasonal POIs in matching month", () => {
    const seasonalPOI = makePOI({
      distanceMetres: 500,
      tags: { name: "Autumn Foliage Spot", natural: "wood" },
    });

    const scoreNov = scorePOI(seasonalPOI, 1000, 11);
    const scoreJul = scorePOI(seasonalPOI, 1000, 7);

    expect(scoreNov).toBeGreaterThan(scoreJul);
  });

  it("returns a score between 0 and 10", () => {
    const poi = makePOI({ distanceMetres: 0 });
    const score = scorePOI(poi, 1000);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(10);
  });
});

describe("detectSeasonalTags", () => {
  it("tags autumn-related POIs for November", () => {
    const tags = detectSeasonalTags(
      "Eikando Zenrinji",
      { tourism: "attraction", name: "Eikando Zenrinji" },
      11
    );
    expect(tags).toContain("koyo");
  });

  it("tags shrine POIs with shichi-go-san for November", () => {
    const tags = detectSeasonalTags(
      "Meiji Shrine",
      { amenity: "place_of_worship", religion: "shinto", name: "Meiji Shrine" },
      11
    );
    expect(tags).toContain("shichi-go-san");
  });

  it("tags onsen/hot spring for autumn/winter months", () => {
    const tags = detectSeasonalTags(
      "Hakone Onsen",
      { natural: "hot_spring", name: "Hakone Onsen" },
      11
    );
    expect(tags).toContain("onsen-season");
  });

  it("returns empty array for non-seasonal POIs", () => {
    const tags = detectSeasonalTags(
      "Generic Shop",
      { shop: "gift", name: "Generic Shop" },
      11
    );
    expect(tags).toEqual([]);
  });

  it("returns empty array when no month is provided", () => {
    const tags = detectSeasonalTags("Autumn Spot", {
      name: "Autumn Spot",
      natural: "wood",
    });
    expect(tags).toEqual([]);
  });
});

describe("rankSuggestions", () => {
  it("returns suggestions sorted by score descending", () => {
    const pois: OverpassPOI[] = [
      makePOI({ name: "Far", distanceMetres: 900 }),
      makePOI({ name: "Near", distanceMetres: 100 }),
      makePOI({ name: "Mid", distanceMetres: 500 }),
    ];

    const ranked = rankSuggestions(pois, 1000);

    expect(ranked[0].name).toBe("Near");
    expect(ranked[ranked.length - 1].name).toBe("Far");
  });

  it("limits results to the specified count", () => {
    const pois = Array.from({ length: 20 }, (_, i) =>
      makePOI({ osmId: i, name: `Place ${i}`, distanceMetres: i * 50 })
    );

    const ranked = rankSuggestions(pois, 1000, undefined, 5);
    expect(ranked).toHaveLength(5);
  });

  it("includes seasonal tags in results", () => {
    const pois: OverpassPOI[] = [
      makePOI({
        name: "Autumn Temple",
        category: "culture_and_history",
        tags: {
          name: "Autumn Temple",
          amenity: "place_of_worship",
          religion: "shinto",
        },
      }),
    ];

    const ranked = rankSuggestions(pois, 1000, 11);
    expect(ranked[0].seasonalTags).toContain("shichi-go-san");
  });

  it("assigns unique IDs to each suggestion", () => {
    const pois: OverpassPOI[] = [
      makePOI({ osmId: 100, name: "A" }),
      makePOI({ osmId: 200, name: "B" }),
    ];

    const ranked = rankSuggestions(pois, 1000);

    expect(ranked[0].id).toBeTruthy();
    expect(ranked[1].id).toBeTruthy();
    expect(ranked[0].id).not.toBe(ranked[1].id);
  });
});
