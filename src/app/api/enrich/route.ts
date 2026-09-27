import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { enrichStop } from "@/services/wikipedia";
import type { EnrichedStop } from "@/types/enrichment";

const RATE_LIMIT_MS = 200;

const StopSchema = z.object({
  name: z.string().min(1),
  nameLocal: z.string().optional(),
  /** Optional — enrichment is name-based; coords are passed through unchanged */
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  notes: z.string().optional(),
});

const RequestSchema = z.object({
  stops: z.array(StopSchema).min(1),
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stops } = RequestSchema.parse(body);

    const enrichedStops: EnrichedStop[] = [];

    for (let i = 0; i < stops.length; i++) {
      if (i > 0) await delay(RATE_LIMIT_MS);

      const stop = stops[i];
      const enrichment = await enrichStop(stop.name);

      enrichedStops.push({
        ...stop,
        latitude: stop.latitude ?? 0,
        longitude: stop.longitude ?? 0,
        ...(enrichment?.nameLocal && { nameLocal: enrichment.nameLocal }),
        enrichment: enrichment
          ? {
              wikipediaSummary: enrichment.wikipediaSummary,
              wikipediaUrl: enrichment.wikipediaUrl,
              imageUrl: enrichment.imageUrl,
              imageAttribution: enrichment.imageAttribution,
            }
          : undefined,
      });
    }

    const enrichedCount = enrichedStops.filter((s) => s.enrichment).length;

    return NextResponse.json({
      stops: enrichedStops,
      totalStops: stops.length,
      totalEnriched: enrichedCount,
      enrichmentRate: Math.round((enrichedCount / stops.length) * 100),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Enrichment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
