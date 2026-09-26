import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { db } from "@/db";
import { itineraries } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

const QuerySchema = z.object({
  tokens: z
    .string()
    .transform((s) => s.split(",").map((t) => t.trim()).filter(Boolean)),
});

/**
 * GET /api/trips?tokens=abc,def,ghi
 * Batch fetch trip metadata by share tokens.
 * Returns minimal data for list display (id, title, shareToken, stopCount, updatedAt).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = QuerySchema.safeParse({
      tokens: searchParams.get("tokens") ?? "",
    });

    if (!parsed.success || parsed.data.tokens.length === 0) {
      return NextResponse.json(
        { error: "tokens query param required (comma-separated)" },
        { status: 400 }
      );
    }

    const { tokens } = parsed.data;

    const rows = await db
      .select({
        id: itineraries.id,
        title: itineraries.title,
        shareToken: itineraries.shareToken,
        updatedAt: itineraries.updatedAt,
      })
      .from(itineraries)
      .where(inArray(itineraries.shareToken, tokens));

    const { stops } = await import("@/db/schema");

    const trips = await Promise.all(
      rows.map(async (row) => {
        const stopRows = await db
          .select()
          .from(stops)
          .where(eq(stops.itineraryId, row.id));
        const itemCount = stopRows.length;

        return {
          id: row.id,
          title: row.title,
          shareToken: row.shareToken,
          itemCount,
          updatedAt: row.updatedAt?.toISOString(),
        };
      })
    );

    return NextResponse.json({ trips });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch trips";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
