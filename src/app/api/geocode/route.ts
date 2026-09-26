import { NextRequest, NextResponse } from "next/server";
import { geocodeStops } from "@/services/geocoder";
import { ParsedStopSchema } from "@/types/itinerary";
import { z } from "zod/v4";

const RequestSchema = z.object({
  stops: z.array(ParsedStopSchema).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.parse(body);
    const geocoded = await geocodeStops(parsed.stops);

    return NextResponse.json({
      stops: geocoded,
      totalRequested: parsed.stops.length,
      totalGeocoded: geocoded.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Geocoding failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
