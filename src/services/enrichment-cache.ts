import { eq } from "drizzle-orm";
import { enrichments } from "@/db/schema";
import type { StopEnrichment } from "./wikipedia";

const CACHE_TTL_DAYS = 7;

interface CachedEnrichment {
  wikipediaSummary: string | null;
  wikipediaUrl: string | null;
  imageUrl: string | null;
  imageAttribution: string | null;
  openingHours: string | null;
  admissionFee: string | null;
  cachedAt: Date;
}

type Database = {
  select: () => any;
  insert: (table: any) => any;
};

export class EnrichmentCache {
  constructor(private db: Database) {}

  async get(stopId: string): Promise<StopEnrichment | null> {
    try {
      const rows = await this.db
        .select()
        .from(enrichments)
        .where(eq(enrichments.stopId, stopId));

      if (rows.length === 0) return null;

      const row: CachedEnrichment = rows[0];

      const age = Date.now() - row.cachedAt.getTime();
      const maxAge = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
      if (age > maxAge) return null;

      return {
        wikipediaSummary: row.wikipediaSummary ?? "",
        wikipediaUrl: row.wikipediaUrl ?? "",
        imageUrl: row.imageUrl ?? undefined,
        imageAttribution: row.imageAttribution ?? undefined,
      };
    } catch {
      return null;
    }
  }

  async set(stopId: string, data: StopEnrichment): Promise<void> {
    try {
      await this.db
        .insert(enrichments)
        .values({
          stopId,
          wikipediaSummary: data.wikipediaSummary,
          wikipediaUrl: data.wikipediaUrl,
          imageUrl: data.imageUrl,
          imageAttribution: data.imageAttribution,
        })
        .onConflictDoUpdate({
          target: enrichments.stopId,
          set: {
            wikipediaSummary: data.wikipediaSummary,
            wikipediaUrl: data.wikipediaUrl,
            imageUrl: data.imageUrl,
            imageAttribution: data.imageAttribution,
            cachedAt: new Date(),
          },
        });
    } catch (error) {
      console.error("Failed to cache enrichment:", error);
    }
  }
}
