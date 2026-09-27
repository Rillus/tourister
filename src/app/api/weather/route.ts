import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { fetchDayWeather } from "@/services/weather";
import { hasValidCoordinates } from "@/lib/coordinates";

const QuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  dates: z.string().min(1),
});

/**
 * GET /api/weather?latitude=&longitude=&dates=YYYY-MM-DD,YYYY-MM-DD
 * Near dates → Open-Meteo forecast; further out → multi-year climate averages.
 */
export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = QuerySchema.parse(params);

    if (!hasValidCoordinates(parsed)) {
      return NextResponse.json(
        { error: "Valid coordinates required" },
        { status: 400 }
      );
    }

    const dates = parsed.dates
      .split(",")
      .map((d) => d.trim())
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));

    if (dates.length === 0) {
      return NextResponse.json({ error: "No valid dates" }, { status: 400 });
    }

    const days = await fetchDayWeather({
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      dates,
    });

    return NextResponse.json({
      days,
      attribution: "Weather data by Open-Meteo.com",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Weather lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
