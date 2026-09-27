import { describe, it, expect, vi, beforeEach } from "vitest";
import { geocodeLocation, geocodeStops, searchPlaces } from "./geocoder";
import type { ParsedStop } from "@/types/itinerary";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function nominatimResponse(lat: string, lon: string, displayName: string) {
  return [
    {
      lat,
      lon,
      display_name: displayName,
      place_id: 123,
    },
  ];
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("searchPlaces", () => {
  it("returns multiple matches", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            lat: "35.66",
            lon: "139.70",
            display_name: "Shibuya, Tokyo",
            place_id: 1,
          },
          {
            lat: "35.68",
            lon: "139.76",
            display_name: "Shibuya Crossing area",
            place_id: 2,
          },
        ]),
    });

    const results = await searchPlaces("Shibuya");
    expect(results).toHaveLength(2);
    expect(results[0].displayName).toBe("Shibuya, Tokyo");
    expect(results[0].latitude).toBe(35.66);
  });

  it("returns empty array for blank query", async () => {
    expect(await searchPlaces("   ")).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe("geocodeLocation", () => {
  it("returns coordinates for a valid location", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          nominatimResponse("35.6762", "139.6503", "Tokyo, Japan")
        ),
    });

    const result = await geocodeLocation("Tokyo");

    expect(result).toEqual({
      latitude: 35.6762,
      longitude: 139.6503,
      displayName: "Tokyo, Japan",
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("q=Tokyo"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": expect.any(String),
        }),
      })
    );
  });

  it("returns null when no results found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const result = await geocodeLocation("NonexistentPlace12345");
    expect(result).toBeNull();
  });

  it("returns null when the API request fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const result = await geocodeLocation("Tokyo");
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await geocodeLocation("Tokyo");
    expect(result).toBeNull();
  });
});

describe("geocodeStops", () => {
  it("geocodes an array of parsed stops", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            nominatimResponse("35.6762", "139.6503", "Tokyo, Japan")
          ),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            nominatimResponse("35.0116", "135.7681", "Kyoto, Japan")
          ),
      });

    const stops: ParsedStop[] = [
      { name: "Tokyo" },
      { name: "Kyoto" },
    ];

    const results = await geocodeStops(stops);

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("Tokyo");
    expect(results[0].latitude).toBe(35.6762);
    expect(results[0].longitude).toBe(139.6503);
    expect(results[1].name).toBe("Kyoto");
    expect(results[1].latitude).toBe(35.0116);
    expect(results[1].longitude).toBe(135.7681);
  });

  it("preserves stop metadata through geocoding", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          nominatimResponse("35.6762", "139.6503", "Tokyo, Japan")
        ),
    });

    const stops: ParsedStop[] = [
      {
        name: "Tokyo",
        dateStart: "2026-11-01",
        dateEnd: "2026-11-03",
        notes: "Explore Shibuya",
      },
    ];

    const results = await geocodeStops(stops);

    expect(results[0].dateStart).toBe("2026-11-01");
    expect(results[0].dateEnd).toBe("2026-11-03");
    expect(results[0].notes).toBe("Explore Shibuya");
  });

  it("excludes stops that fail to geocode", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve(
            nominatimResponse("35.6762", "139.6503", "Tokyo, Japan")
          ),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    const stops: ParsedStop[] = [
      { name: "Tokyo" },
      { name: "UnknownPlace12345" },
    ];

    const results = await geocodeStops(stops);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Tokyo");
  });

  it("rate-limits requests with a delay between calls", async () => {
    const callTimes: number[] = [];
    mockFetch.mockImplementation(() => {
      callTimes.push(Date.now());
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            nominatimResponse("35.6762", "139.6503", "Tokyo, Japan")
          ),
      });
    });

    const stops: ParsedStop[] = [
      { name: "Tokyo" },
      { name: "Kyoto" },
      { name: "Osaka" },
    ];

    await geocodeStops(stops);

    // Nominatim requires max 1 request per second
    for (let i = 1; i < callTimes.length; i++) {
      const gap = callTimes[i] - callTimes[i - 1];
      expect(gap).toBeGreaterThanOrEqual(100);
    }
  });
});
