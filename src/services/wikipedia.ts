const WIKI_REST_BASE = "https://en.wikipedia.org/api/rest_v1/page/summary";
const WIKI_SEARCH_BASE = "https://en.wikipedia.org/w/rest.php/v1/search/page";
const WIKI_API_BASE = "https://en.wikipedia.org/w/api.php";
const USER_AGENT = "Tourister/0.1 (travel itinerary app)";

const headers = {
  "User-Agent": USER_AGENT,
  Accept: "application/json",
};

export interface WikipediaSummary {
  title: string;
  summary: string;
  url: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  description?: string;
}

export interface StopEnrichment {
  wikipediaSummary: string;
  wikipediaUrl: string;
  imageUrl?: string;
  imageAttribution?: string;
  nameLocal?: string;
}

async function fetchSummaryByTitle(
  title: string
): Promise<WikipediaSummary | null> {
  try {
    const encoded = encodeURIComponent(title);
    const response = await fetch(`${WIKI_REST_BASE}/${encoded}`, { headers });

    if (!response.ok) return null;

    const data = await response.json();

    return {
      title: data.title,
      summary: data.extract,
      url: data.content_urls?.desktop?.page,
      imageUrl: data.originalimage?.source,
      thumbnailUrl: data.thumbnail?.source,
      description: data.description,
    };
  } catch {
    return null;
  }
}

async function searchWikipedia(query: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({ q: query, limit: "1" });
    const response = await fetch(`${WIKI_SEARCH_BASE}?${params}`, { headers });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.pages || data.pages.length === 0) return null;

    return data.pages[0].title;
  } catch {
    return null;
  }
}

export async function fetchWikipediaSummary(
  query: string
): Promise<WikipediaSummary | null> {
  // Try direct title lookup first
  const direct = await fetchSummaryByTitle(query);
  if (direct) return direct;

  // Fall back to search
  const title = await searchWikipedia(query);
  if (!title) return null;

  return fetchSummaryByTitle(title);
}

export async function fetchJapaneseName(
  title: string
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      action: "query",
      titles: title,
      prop: "langlinks",
      lllang: "ja",
      format: "json",
      origin: "*",
    });

    const response = await fetch(`${WIKI_API_BASE}?${params}`, { headers });
    if (!response.ok) return null;

    const data = await response.json();
    const pages = data.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as Record<string, unknown>;
    const langlinks = page?.langlinks as Array<{ lang: string; "*": string }>;
    if (!langlinks || langlinks.length === 0) return null;

    return langlinks[0]["*"];
  } catch {
    return null;
  }
}

export async function enrichStop(
  locationName: string
): Promise<StopEnrichment | null> {
  const summary = await fetchWikipediaSummary(locationName);
  if (!summary) return null;

  const japaneseName = await fetchJapaneseName(summary.title);

  const enrichment: StopEnrichment = {
    wikipediaSummary: summary.summary,
    wikipediaUrl: summary.url,
    imageUrl: summary.imageUrl,
    imageAttribution: summary.imageUrl
      ? `Wikimedia Commons (CC) — ${summary.title}`
      : undefined,
    ...(japaneseName && { nameLocal: japaneseName }),
  };

  return enrichment;
}
