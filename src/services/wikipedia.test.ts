import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchWikipediaSummary,
  fetchJapaneseName,
  enrichStop,
} from "./wikipedia";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

function wikipediaSummaryResponse(overrides: Record<string, unknown> = {}) {
  return {
    title: "Fushimi Inari-taisha",
    extract: "Fushimi Inari-taisha is the head shrine of the kami Inari.",
    content_urls: {
      desktop: { page: "https://en.wikipedia.org/wiki/Fushimi_Inari-taisha" },
    },
    originalimage: {
      source:
        "https://upload.wikimedia.org/wikipedia/commons/fushimi_inari.jpg",
    },
    thumbnail: {
      source:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/fushimi_inari.jpg",
    },
    description: "Shinto shrine in Kyoto, Japan",
    ...overrides,
  };
}

describe("fetchWikipediaSummary", () => {
  it("returns summary data for a valid location", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(wikipediaSummaryResponse()),
    });

    const result = await fetchWikipediaSummary("Fushimi Inari");

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Fushimi Inari-taisha");
    expect(result!.summary).toBe(
      "Fushimi Inari-taisha is the head shrine of the kami Inari."
    );
    expect(result!.url).toBe(
      "https://en.wikipedia.org/wiki/Fushimi_Inari-taisha"
    );
    expect(result!.imageUrl).toBe(
      "https://upload.wikimedia.org/wikipedia/commons/fushimi_inari.jpg"
    );
    expect(result!.thumbnailUrl).toBe(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/fushimi_inari.jpg"
    );
  });

  it("calls the correct Wikipedia REST API URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(wikipediaSummaryResponse()),
    });

    await fetchWikipediaSummary("Fushimi Inari");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://en.wikipedia.org/api/rest_v1/page/summary/Fushimi%20Inari",
      expect.objectContaining({
        headers: expect.objectContaining({
          "User-Agent": expect.any(String),
        }),
      })
    );
  });

  it("returns null when the article is not found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const result = await fetchWikipediaSummary("NonexistentPlace12345");
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await fetchWikipediaSummary("Tokyo");
    expect(result).toBeNull();
  });

  it("handles articles without images gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve(
          wikipediaSummaryResponse({
            originalimage: undefined,
            thumbnail: undefined,
          })
        ),
    });

    const result = await fetchWikipediaSummary("Tokyo");

    expect(result).not.toBeNull();
    expect(result!.imageUrl).toBeUndefined();
    expect(result!.thumbnailUrl).toBeUndefined();
    expect(result!.summary).toBeTruthy();
  });

  it("uses search fallback when direct lookup returns 404", async () => {
    mockFetch
      // Direct lookup fails
      .mockResolvedValueOnce({ ok: false, status: 404 })
      // Search API returns results
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            pages: [
              {
                title: "Fushimi Inari-taisha",
                key: "Fushimi_Inari-taisha",
              },
            ],
          }),
      })
      // Second summary fetch succeeds
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(wikipediaSummaryResponse()),
      });

    const result = await fetchWikipediaSummary("Fushimi Inari Shrine");

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Fushimi Inari-taisha");
  });
});

describe("fetchJapaneseName", () => {
  it("returns the Japanese page title for a known location", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          query: {
            pages: {
              "12345": {
                langlinks: [{ lang: "ja", "*": "伏見稲荷大社" }],
              },
            },
          },
        }),
    });

    const result = await fetchJapaneseName("Fushimi_Inari-taisha");
    expect(result).toBe("伏見稲荷大社");
  });

  it("returns null when no Japanese link exists", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          query: {
            pages: {
              "12345": {},
            },
          },
        }),
    });

    const result = await fetchJapaneseName("SomePlace");
    expect(result).toBeNull();
  });

  it("returns null on error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await fetchJapaneseName("Tokyo");
    expect(result).toBeNull();
  });
});

describe("enrichStop", () => {
  it("combines summary and Japanese name into a full enrichment", async () => {
    mockFetch
      // Summary fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(wikipediaSummaryResponse()),
      })
      // Japanese name fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            query: {
              pages: {
                "12345": {
                  langlinks: [{ lang: "ja", "*": "伏見稲荷大社" }],
                },
              },
            },
          }),
      });

    const result = await enrichStop("Fushimi Inari");

    expect(result).not.toBeNull();
    expect(result!.wikipediaSummary).toBeTruthy();
    expect(result!.wikipediaUrl).toContain("wikipedia.org");
    expect(result!.imageUrl).toBeTruthy();
    expect(result!.nameLocal).toBe("伏見稲荷大社");
  });

  it("returns partial enrichment when Japanese name is unavailable", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(wikipediaSummaryResponse()),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            query: { pages: { "12345": {} } },
          }),
      });

    const result = await enrichStop("Fushimi Inari");

    expect(result).not.toBeNull();
    expect(result!.wikipediaSummary).toBeTruthy();
    expect(result!.nameLocal).toBeUndefined();
  });

  it("returns null when Wikipedia has no article at all", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 404 })
      // Search also fails
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ pages: [] }),
      });

    const result = await enrichStop("CompletelyUnknownPlace");
    expect(result).toBeNull();
  });
});
