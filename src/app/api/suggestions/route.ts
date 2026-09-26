import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { queryNearbyPOIs } from "@/services/overpass";
import { rankSuggestions } from "@/services/suggestion-engine";

const RequestSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  radiusMetres: z.number().min(100).max(5000).optional().default(1000),
  month: z.number().min(1).max(12).optional(),
  limit: z.number().min(1).max(50).optional().default(15),
  category: z
    .enum([
      "food_and_drink",
      "culture_and_history",
      "nature_and_parks",
      "shopping",
      "nightlife",
      "experiences",
    ])
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const params = RequestSchema.parse(body);

    const pois = await queryNearbyPOIs(
      params.latitude,
      params.longitude,
      params.radiusMetres
    );

    const filtered = params.category
      ? pois.filter((p) => p.category === params.category)
      : pois;

    const suggestions = rankSuggestions(
      filtered,
      params.radiusMetres,
      params.month,
      params.limit
    );

    const categoryCounts = suggestions.reduce(
      (acc, s) => {
        acc[s.category] = (acc[s.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      suggestions,
      total: suggestions.length,
      categoryCounts,
      radiusMetres: params.radiusMetres,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to fetch suggestions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
