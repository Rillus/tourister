import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  itineraries,
  days,
  stops,
  enrichments,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod/v4";
import { assertTripPassword } from "@/lib/trip-auth";
import { hashPassword } from "@/lib/trip-password";

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
  /** New password; omit or empty to leave unchanged */
  password: z.string().min(4).optional(),
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

    const auth = await assertTripPassword(itinerary.passwordHash, request);
    if (!auth.ok) {
      return NextResponse.json(
        { error: "Password required", locked: true },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = UpdateTripSchema.parse(body);

    const itineraryUpdates: {
      title?: string;
      passwordHash?: string;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (data.title) {
      itineraryUpdates.title = data.title;
    }
    if (data.password?.trim()) {
      itineraryUpdates.passwordHash = await hashPassword(data.password);
    }

    if (data.days !== undefined) {
      const existingStopRows = await db
        .select({ id: stops.id })
        .from(stops)
        .where(eq(stops.itineraryId, itinerary.id));

      if (existingStopRows.length > 0) {
        await db
          .delete(enrichments)
          .where(
            inArray(
              enrichments.stopId,
              existingStopRows.map((s) => s.id)
            )
          );
      }
      await db.delete(stops).where(eq(stops.itineraryId, itinerary.id));
      await db.delete(days).where(eq(days.itineraryId, itinerary.id));

      if (data.days.length > 0) {
        const insertedDays = await db
          .insert(days)
          .values(
            data.days.map((dayInput, dayIndex) => ({
              itineraryId: itinerary.id,
              dateStart: dayInput.dateStart,
              dateEnd: dayInput.dateEnd,
              name: dayInput.name ?? null,
              sortOrder: dayInput.sortOrder ?? dayIndex,
            }))
          )
          .returning();

        const stopValues: {
          itineraryId: string;
          dayId: string;
          name: string;
          nameLocal: string | null;
          latitude: string | null;
          longitude: string | null;
          notes: string | null;
          startTime: string | null;
          endTime: string | null;
          sortOrder: number;
        }[] = [];

        const enrichmentSources: {
          stopIndex: number;
          enrichment: NonNullable<
            (typeof data.days)[0]["items"][0]["enrichment"]
          >;
        }[] = [];

        let stopIndex = 0;
        for (let dayIndex = 0; dayIndex < data.days.length; dayIndex++) {
          const dayInput = data.days[dayIndex];
          const dayId = insertedDays[dayIndex].id;
          for (
            let itemIndex = 0;
            itemIndex < dayInput.items.length;
            itemIndex++
          ) {
            const item = dayInput.items[itemIndex];
            stopValues.push({
              itineraryId: itinerary.id,
              dayId,
              name: item.name,
              nameLocal: item.nameLocal ?? null,
              latitude: item.latitude?.toString() ?? null,
              longitude: item.longitude?.toString() ?? null,
              notes: item.notes ?? null,
              startTime: item.startTime ?? null,
              endTime: item.endTime ?? null,
              sortOrder: itemIndex,
            });
            if (item.enrichment) {
              enrichmentSources.push({
                stopIndex,
                enrichment: item.enrichment,
              });
            }
            stopIndex += 1;
          }
        }

        if (stopValues.length > 0) {
          const insertedStops = await db
            .insert(stops)
            .values(stopValues)
            .returning();

          if (enrichmentSources.length > 0) {
            await db.insert(enrichments).values(
              enrichmentSources.map(({ stopIndex: i, enrichment }) => ({
                stopId: insertedStops[i].id,
                wikipediaSummary: enrichment.wikipediaSummary ?? null,
                wikipediaUrl: enrichment.wikipediaUrl ?? null,
                imageUrl: enrichment.imageUrl ?? null,
                imageAttribution: enrichment.imageAttribution ?? null,
              }))
            );
          }
        }
      }
    }

    if (data.title || data.password?.trim() || data.days !== undefined) {
      await db
        .update(itineraries)
        .set(itineraryUpdates)
        .where(eq(itineraries.id, itinerary.id));
    }

    const [updated] = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, itinerary.id));

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      shareToken: updated.shareToken,
      passwordProtected: Boolean(updated.passwordHash),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
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

/**
 * DELETE /api/trips/[token]
 * Permanently delete a trip (cascade removes days, stops, enrichments).
 */
export async function DELETE(
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

    const auth = await assertTripPassword(itinerary.passwordHash, request);
    if (!auth.ok) {
      return NextResponse.json(
        { error: "Password required", locked: true },
        { status: 401 }
      );
    }

    await db.delete(itineraries).where(eq(itineraries.id, itinerary.id));

    return NextResponse.json({ deleted: true, shareToken: token });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete trip";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
