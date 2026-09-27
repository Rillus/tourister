import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { searchPlaces } from "@/services/geocoder";

const QuerySchema = z.object({
  q: z.string().min(1).max(200),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

/**
 * GET /api/places?q=Shibuya&latitude=35.66&longitude=139.7
 * Search for places to drop a pin.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = QuerySchema.parse({
      q: searchParams.get("q") ?? "",
      latitude: searchParams.get("latitude") ?? undefined,
      longitude: searchParams.get("longitude") ?? undefined,
    });

    const near =
      parsed.latitude != null && parsed.longitude != null
        ? { latitude: parsed.latitude, longitude: parsed.longitude }
        : undefined;

    const places = await searchPlaces(parsed.q, { limit: 5, near });
    return NextResponse.json({ places });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Query required", details: error.issues },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Place search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
