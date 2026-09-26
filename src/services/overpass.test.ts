import { describe, it, expect, vi, beforeEach } from "vitest";
import { queryNearbyPOIs } from "./overpass";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

function overpassResponse(elements: Record<string, unknown>[]) {
  return { elements };
}

const sampleElements = [
  {
    type: "node",
    id: 1001,
    lat: 34.9672,
    lon: 135.7728,
    tags: {
      name: "Nezameya",
      "name:ja": "祢ざめ家",
      amenity: "restaurant",
      cuisine: "sushi",
    },
  },
  {
    type: "node",
    id: 1002,
    lat: 34.968,
    lon: 135.774,
    tags: {
      name: "Fushimi Inari Taisha",
      "name:ja": "伏見稲荷大社",
      tourism: "attraction",
      historic: "yes",
    },
  },
  {
    type: "node",
    id: 1003,
    lat: 34.9665,
    lon: 135.772,
    tags: {
      name: "Inari Park",
      leisure: "park",
      "name:en": "Inari Park",
    },
  },
  {
    type: "node",
    id: 1004,
    lat: 34.969,
    lon: 135.775,
    tags: {
      name: "Kyoto Souvenir Shop",
      shop: "gift",
    },
  },
  {
    type: "node",
    id: 1005,
    lat: 34.9675,
    lon: 135.773,
    tags: {
      name: "Sake Bar Inari",
      amenity: "bar",
    },
  },
];

describe("queryNearbyPOIs", () => {
  it("returns POIs near the given coordinates", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(overpassResponse(sampleElements)),
    });

    const results = await queryNearbyPOIs(34.9671, 135.7727, 1000);

    expect(results).toHaveLength(5);
    expect(results[0]).toMatchObject({
      name: expect.any(String),
      latitude: expect.any(Number),
      longitude: expect.any(Number),
      category: expect.any(String),
    });
  });

  it("sends correct Overpass query with radius", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(overpassResponse([])),
    });

    await queryNearbyPOIs(34.9671, 135.7727, 500);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://overpass-api.de/api/interpreter",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("500"),
      })
    );
  });

  it("extracts Japanese names from tags", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(overpassResponse(sampleElements)),
    });

    const results = await queryNearbyPOIs(34.9671, 135.7727, 1000);

    const nezameya = results.find((r) => r.name === "Nezameya");
    expect(nezameya?.nameLocal).toBe("祢ざめ家");
  });

  it("calculates distance from the origin point", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          overpassResponse([
            {
              type: "node",
              id: 2001,
              lat: 34.9672,
              lon: 135.7728,
              tags: { name: "Nearby Place", amenity: "cafe" },
            },
          ])
        ),
    });

    const results = await queryNearbyPOIs(34.9671, 135.7727, 1000);

    expect(results[0].distanceMetres).toBeGreaterThan(0);
    expect(results[0].distanceMetres).toBeLessThan(50);
  });

  it("skips elements without a name", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          overpassResponse([
            {
              type: "node",
              id: 3001,
              lat: 34.9672,
              lon: 135.7728,
              tags: { amenity: "bench" },
            },
          ])
        ),
    });

    const results = await queryNearbyPOIs(34.9671, 135.7727, 1000);
    expect(results).toHaveLength(0);
  });

  it("returns empty array on API failure", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });

    const results = await queryNearbyPOIs(34.9671, 135.7727, 1000);
    expect(results).toEqual([]);
  });

  it("returns empty array on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("timeout"));

    const results = await queryNearbyPOIs(34.9671, 135.7727, 1000);
    expect(results).toEqual([]);
  });

  it("categorises POIs based on OSM tags", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(overpassResponse(sampleElements)),
    });

    const results = await queryNearbyPOIs(34.9671, 135.7727, 1000);

    const restaurant = results.find((r) => r.name === "Nezameya");
    expect(restaurant?.category).toBe("food_and_drink");

    const temple = results.find((r) => r.name === "Fushimi Inari Taisha");
    expect(temple?.category).toBe("culture_and_history");

    const park = results.find((r) => r.name === "Inari Park");
    expect(park?.category).toBe("nature_and_parks");

    const shop = results.find((r) => r.name === "Kyoto Souvenir Shop");
    expect(shop?.category).toBe("shopping");

    const bar = results.find((r) => r.name === "Sake Bar Inari");
    expect(bar?.category).toBe("nightlife");
  });
});
