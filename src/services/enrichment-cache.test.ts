import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnrichmentCache } from "./enrichment-cache";
import type { StopEnrichment } from "./wikipedia";

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
};

function createCache() {
  return new EnrichmentCache(mockDb as never);
}

const sampleEnrichment: StopEnrichment = {
  wikipediaSummary: "Fushimi Inari-taisha is the head shrine of Inari.",
  wikipediaUrl: "https://en.wikipedia.org/wiki/Fushimi_Inari-taisha",
  imageUrl: "https://upload.wikimedia.org/fushimi.jpg",
  imageAttribution: "Wikimedia Commons (CC)",
  nameLocal: "伏見稲荷大社",
};

const cachedRow = {
  id: "abc",
  stopId: "stop-1",
  wikipediaSummary: sampleEnrichment.wikipediaSummary,
  wikipediaUrl: sampleEnrichment.wikipediaUrl,
  imageUrl: sampleEnrichment.imageUrl,
  imageAttribution: sampleEnrichment.imageAttribution,
  openingHours: null,
  admissionFee: null,
  cachedAt: new Date(),
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("EnrichmentCache", () => {
  it("returns cached enrichment when it exists and is fresh", async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([cachedRow]),
    };
    mockDb.select.mockReturnValue(chain);

    const cache = createCache();
    const result = await cache.get("stop-1");

    expect(result).not.toBeNull();
    expect(result!.wikipediaSummary).toBe(sampleEnrichment.wikipediaSummary);
    expect(result!.wikipediaUrl).toBe(sampleEnrichment.wikipediaUrl);
    expect(result!.imageUrl).toBe(sampleEnrichment.imageUrl);
  });

  it("returns null when no cached enrichment exists", async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    mockDb.select.mockReturnValue(chain);

    const cache = createCache();
    const result = await cache.get("stop-missing");

    expect(result).toBeNull();
  });

  it("returns null when cached data is stale (older than 7 days)", async () => {
    const staleRow = {
      ...cachedRow,
      cachedAt: new Date("2026-02-01"),
    };
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([staleRow]),
    };
    mockDb.select.mockReturnValue(chain);

    const cache = createCache();
    const result = await cache.get("stop-1");

    expect(result).toBeNull();
  });

  it("stores enrichment data in the database", async () => {
    const chain = {
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockResolvedValue([]),
    };
    mockDb.insert.mockReturnValue(chain);

    const cache = createCache();
    await cache.set("stop-1", sampleEnrichment);

    expect(mockDb.insert).toHaveBeenCalled();
    expect(chain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        stopId: "stop-1",
        wikipediaSummary: sampleEnrichment.wikipediaSummary,
        wikipediaUrl: sampleEnrichment.wikipediaUrl,
        imageUrl: sampleEnrichment.imageUrl,
        imageAttribution: sampleEnrichment.imageAttribution,
      })
    );
  });
});
