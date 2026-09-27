import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  itineraries,
  days,
  stops,
  enrichments,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

const EnrichmentSchema = z.object({
  wikipediaSummary: z.string().optional(),
  wikipediaUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  imageAttribution: z.string().optional(),
});

const ItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  nameLocal: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  enrichment: EnrichmentSchema.optional(),
});

const DaySchema = z.object({
  id: z.string().optional(),
  dateStart: z.string(),
  dateEnd: z.string(),
  name: z.string().optional(),
  sortOrder: z.number().default(0),
  items: z.array(ItemSchema).default([]),
});

const UpdateTripSchema = z.object({
  title: z.string().min(1).optional(),
  days: z.array(DaySchema).optional(),
});

/**
 * PATCH /api/trips/[token]
 * Update a trip: title, and/or days with items.
 * Replaces the entire days/items structure when days are provided.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json(
        { error: "Token required" },
        { status: 400 }
      );
    }

    const [itinerary] = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.shareToken, token));

    if (!itinerary) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = UpdateTripSchema.parse(body);

    if (data.title) {
      await db
        .update(itineraries)
        .set({ title: data.title, updatedAt: new Date() })
        .where(eq(itineraries.id, itinerary.id));
    }

    if (data.days !== undefined) {
      const existingDays = await db
        .select()
        .from(days)
        .where(eq(days.itineraryId, itinerary.id));

      for (const day of existingDays) {
        const dayStops = await db
          .select()
          .from(stops)
          .where(eq(stops.dayId, day.id));
        for (const stop of dayStops) {
          await db.delete(enrichments).where(eq(enrichments.stopId, stop.id));
        }
        await db.delete(stops).where(eq(stops.dayId, day.id));
        await db.delete(days).where(eq(days.id, day.id));
      }

      const legacyStops = await db
        .select()
        .from(stops)
        .where(eq(stops.itineraryId, itinerary.id));
      for (const stop of legacyStops) {
        if (stop.dayId === null) {
          await db.delete(enrichments).where(eq(enrichments.stopId, stop.id));
          await db.delete(stops).where(eq(stops.id, stop.id));
        }
      }

      for (let dayIndex = 0; dayIndex < data.days.length; dayIndex++) {
        const dayInput = data.days[dayIndex];
        const [insertedDay] = await db
          .insert(days)
          .values({
            itineraryId: itinerary.id,
            dateStart: dayInput.dateStart,
            dateEnd: dayInput.dateEnd,
            name: dayInput.name ?? null,
            sortOrder: dayInput.sortOrder ?? dayIndex,
          })
          .returning();

        for (let itemIndex = 0; itemIndex < dayInput.items.length; itemIndex++) {
          const item = dayInput.items[itemIndex];
          const [insertedStop] = await db
            .insert(stops)
            .values({
              itineraryId: itinerary.id,
              dayId: insertedDay.id,
              name: item.name,
              nameLocal: item.nameLocal ?? null,
              latitude: item.latitude?.toString() ?? null,
              longitude: item.longitude?.toString() ?? null,
              notes: item.notes ?? null,
              startTime: item.startTime ?? null,
              endTime: item.endTime ?? null,
              sortOrder: itemIndex,
            })
            .returning();

          if (item.enrichment) {
            await db.insert(enrichments).values({
              stopId: insertedStop.id,
              wikipediaSummary: item.enrichment.wikipediaSummary ?? null,
              wikipediaUrl: item.enrichment.wikipediaUrl ?? null,
              imageUrl: item.enrichment.imageUrl ?? null,
              imageAttribution: item.enrichment.imageAttribution ?? null,
            });
          }
        }
      }
    }

    const [updated] = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, itinerary.id));

    return NextResponse.json({
      ...updated,
      shareToken: updated.shareToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Failed to update trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
