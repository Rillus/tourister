import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { itineraries, stops, enrichments } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod/v4";
import { hashPassword } from "@/lib/trip-password";

const EnrichmentSchema = z.object({
  wikipediaSummary: z.string().optional(),
  wikipediaUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  imageAttribution: z.string().optional(),
});

const CreateItinerarySchema = z.object({
  title: z.string().min(1),
  password: z.string().min(4),
  stops: z
    .array(
      z.object({
        name: z.string().min(1),
        nameLocal: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        dateStart: z.string().optional(),
        dateEnd: z.string().optional(),
        notes: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        enrichment: EnrichmentSchema.optional(),
      })
    )
    .min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = CreateItinerarySchema.parse(body);

    const shareToken = uuidv4().slice(0, 8);
    const passwordHash = await hashPassword(data.password);

    const [itinerary] = await db
      .insert(itineraries)
      .values({
        title: data.title,
        shareToken,
        passwordHash,
      })
      .returning();

    const stopValues = data.stops.map((stop, index) => ({
      itineraryId: itinerary.id,
      name: stop.name,
      nameLocal: stop.nameLocal,
      latitude: stop.latitude?.toString(),
      longitude: stop.longitude?.toString(),
      dateStart: stop.dateStart,
      dateEnd: stop.dateEnd,
      notes: stop.notes,
      startTime: stop.startTime,
      endTime: stop.endTime,
      sortOrder: index,
    }));

    const insertedStops = await db
      .insert(stops)
      .values(stopValues)
      .returning();

    const stopsWithEnrichment = data.stops.filter((s) => s.enrichment);
    if (stopsWithEnrichment.length > 0) {
      const enrichmentValues = insertedStops
        .map((stop, index) => {
          const enrichment = data.stops[index]?.enrichment;
          if (!enrichment) return null;
          return {
            stopId: stop.id,
            wikipediaSummary: enrichment.wikipediaSummary,
            wikipediaUrl: enrichment.wikipediaUrl,
            imageUrl: enrichment.imageUrl,
            imageAttribution: enrichment.imageAttribution,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);

      if (enrichmentValues.length > 0) {
        await db.insert(enrichments).values(enrichmentValues);
      }
    }

    return NextResponse.json(
      {
        id: itinerary.id,
        title: itinerary.title,
        shareToken: itinerary.shareToken,
        passwordProtected: true,
        createdAt: itinerary.createdAt,
        updatedAt: itinerary.updatedAt,
        stops: insertedStops,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to create itinerary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
