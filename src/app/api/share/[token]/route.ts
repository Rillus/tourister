import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { itineraries, stops, enrichments, days } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import type { EnrichedStop } from "@/types/enrichment";
import type { Trip, TripDay, TripItem } from "@/types/trip";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json(
        { error: "Share token required" },
        { status: 400 }
      );
    }

    const [itinerary] = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.shareToken, token));

    if (!itinerary) {
      return NextResponse.json(
        { error: "Itinerary not found" },
        { status: 404 }
      );
    }

    const stopsRows = await db
      .select()
      .from(stops)
      .where(eq(stops.itineraryId, itinerary.id))
      .orderBy(asc(stops.sortOrder));

    const stopIds = stopsRows.map((s) => s.id);
    const enrichmentsList =
      stopIds.length > 0
        ? await db
            .select()
            .from(enrichments)
            .where(inArray(enrichments.stopId, stopIds))
        : [];

    const enrichmentMap = new Map(
      enrichmentsList.map((e) => [e.stopId, e])
    );

    const mapStopToItem = (stop: (typeof stopsRows)[0]): EnrichedStop => {
      const lat = stop.latitude ? parseFloat(stop.latitude) : 0;
      const lon = stop.longitude ? parseFloat(stop.longitude) : 0;
      const enrichment = enrichmentMap.get(stop.id);
      return {
        name: stop.name,
        nameLocal: stop.nameLocal ?? undefined,
        latitude: lat,
        longitude: lon,
        dateStart: stop.dateStart ?? undefined,
        dateEnd: stop.dateEnd ?? undefined,
        startTime: stop.startTime ?? undefined,
        endTime: stop.endTime ?? undefined,
        notes: stop.notes ?? undefined,
        enrichment: enrichment
          ? {
              wikipediaSummary: enrichment.wikipediaSummary ?? "",
              wikipediaUrl: enrichment.wikipediaUrl ?? "",
              imageUrl: enrichment.imageUrl ?? undefined,
              imageAttribution: enrichment.imageAttribution ?? undefined,
            }
          : undefined,
      };
    };

    const daysRows = await db
      .select()
      .from(days)
      .where(eq(days.itineraryId, itinerary.id))
      .orderBy(asc(days.sortOrder));

    if (daysRows.length > 0) {
      const dayIds = daysRows.map((d) => d.id);
      const stopsInDays = await db
        .select()
        .from(stops)
        .where(inArray(stops.dayId, dayIds))
        .orderBy(asc(stops.sortOrder));

      const stopsInDaysEnrichments =
        stopsInDays.length > 0
          ? await db
              .select()
              .from(enrichments)
              .where(
                inArray(
                  enrichments.stopId,
                  stopsInDays.map((s) => s.id)
                )
              )
          : [];
      const enrichMapForItems = new Map(
        stopsInDaysEnrichments.map((e) => [e.stopId, e])
      );

      const tripDays: TripDay[] = daysRows.map((day) => {
        const dayStops = stopsInDays.filter((s) => s.dayId === day.id);
        const items: TripItem[] = dayStops.map((stop) => {
          const e = enrichMapForItems.get(stop.id);
          return {
            id: stop.id,
            dayId: stop.dayId ?? undefined,
            name: stop.name,
            nameLocal: stop.nameLocal ?? undefined,
            latitude: stop.latitude ? parseFloat(stop.latitude) : 0,
            longitude: stop.longitude ? parseFloat(stop.longitude) : 0,
            notes: stop.notes ?? undefined,
            startTime: stop.startTime ?? undefined,
            endTime: stop.endTime ?? undefined,
            enrichment: e
              ? {
                  wikipediaSummary: e.wikipediaSummary ?? "",
                  wikipediaUrl: e.wikipediaUrl ?? "",
                  imageUrl: e.imageUrl ?? undefined,
                  imageAttribution: e.imageAttribution ?? undefined,
                }
              : undefined,
          };
        });
        return {
          id: day.id,
          dateStart: day.dateStart,
          dateEnd: day.dateEnd,
          name: day.name ?? undefined,
          sortOrder: day.sortOrder,
          items,
        };
      });

      const allStopsFromDays: EnrichedStop[] = tripDays.flatMap((d) =>
        d.items.map((item) => ({
          ...item,
          dateStart: d.dateStart,
          dateEnd: d.dateEnd,
        }))
      );

      const trip: Trip = {
        id: itinerary.id,
        title: itinerary.title,
        shareToken: itinerary.shareToken,
        createdAt: itinerary.createdAt?.toISOString(),
        updatedAt: itinerary.updatedAt?.toISOString(),
        days: tripDays,
        stops: allStopsFromDays,
      };

      return NextResponse.json(trip);
    }

    const enrichedStops: EnrichedStop[] = stopsRows.map(mapStopToItem);

    return NextResponse.json({
      id: itinerary.id,
      title: itinerary.title,
      shareToken: itinerary.shareToken,
      createdAt: itinerary.createdAt?.toISOString(),
      updatedAt: itinerary.updatedAt?.toISOString(),
      days: [],
      stops: enrichedStops,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch itinerary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
