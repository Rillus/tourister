import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { queryNearbyPOIs } from "@/services/overpass";
import type { OverpassPOI } from "@/services/overpass";

vi.mock("@/services/overpass", () => ({
  queryNearbyPOIs: vi.fn(),
}));

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makePOI(overrides: Partial<OverpassPOI> = {}): OverpassPOI {
  return {
    osmId: 1,
    name: "Test Place",
    latitude: 35.0,
    longitude: 135.0,
    category: "food_and_drink",
    distanceMetres: 200,
    tags: {},
    ...overrides,
  };
}

describe("POST /api/suggestions", () => {
  beforeEach(() => {
    vi.mocked(queryNearbyPOIs).mockResolvedValue([]);
  });

  it("returns suggestions for valid coordinates", async () => {
    const pois = [
      makePOI({ osmId: 1, name: "Cafe A", category: "food_and_drink" }),
      makePOI({ osmId: 2, name: "Temple B", category: "culture_and_history" }),
    ];
    vi.mocked(queryNearbyPOIs).mockResolvedValueOnce(pois);

    const request = createRequest({
      latitude: 34.9671,
      longitude: 135.7727,
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.suggestions).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.categoryCounts).toEqual({
      food_and_drink: 1,
      culture_and_history: 1,
    });
    expect(data.radiusMetres).toBe(1000);
  });

  it("calls queryNearbyPOIs with correct parameters", async () => {
    const request = createRequest({
      latitude: 35.5,
      longitude: 139.5,
      radiusMetres: 500,
    });

    await POST(request as never);

    expect(queryNearbyPOIs).toHaveBeenCalledWith(35.5, 139.5, 500);
  });

  it("filters by category when provided", async () => {
    const pois = [
      makePOI({ osmId: 1, name: "Cafe", category: "food_and_drink" }),
      makePOI({ osmId: 2, name: "Temple", category: "culture_and_history" }),
    ];
    vi.mocked(queryNearbyPOIs).mockResolvedValueOnce(pois);

    const request = createRequest({
      latitude: 34.9671,
      longitude: 135.7727,
      category: "food_and_drink",
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(data.suggestions).toHaveLength(1);
    expect(data.suggestions[0].category).toBe("food_and_drink");
  });

  it("passes month for seasonal ranking", async () => {
    const pois = [
      makePOI({
        name: "Eikando",
        category: "culture_and_history",
        tags: { tourism: "attraction" },
      }),
    ];
    vi.mocked(queryNearbyPOIs).mockResolvedValueOnce(pois);

    const request = createRequest({
      latitude: 35.0,
      longitude: 135.7,
      month: 11,
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.suggestions[0].seasonalTags).toBeDefined();
  });

  it("respects limit parameter", async () => {
    const pois = Array.from({ length: 20 }, (_, i) =>
      makePOI({ osmId: i, name: `Place ${i}`, distanceMetres: i * 50 })
    );
    vi.mocked(queryNearbyPOIs).mockResolvedValueOnce(pois);

    const request = createRequest({
      latitude: 35.0,
      longitude: 135.0,
      limit: 5,
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(data.suggestions).toHaveLength(5);
    expect(data.total).toBe(5);
  });

  it("returns 400 for invalid request body", async () => {
    const request = createRequest({
      latitude: "invalid",
      longitude: 135.0,
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request");
    expect(data.details).toBeDefined();
  });

  it("returns 400 when latitude is missing", async () => {
    const request = createRequest({
      longitude: 135.0,
    });

    const response = await POST(request as never);

    expect(response.status).toBe(400);
  });

  it("returns 400 when radius is out of bounds", async () => {
    const request = createRequest({
      latitude: 35.0,
      longitude: 135.0,
      radiusMetres: 50,
    });

    const response = await POST(request as never);

    expect(response.status).toBe(400);
  });
});
