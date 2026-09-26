import { NextRequest, NextResponse } from "next/server";
import { parseItineraryText } from "@/services/itinerary-parser";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, title } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text' field" },
        { status: 400 }
      );
    }

    const parsed = parseItineraryText(text, title);
    return NextResponse.json(parsed);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to parse itinerary";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
