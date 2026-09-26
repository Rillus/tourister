import type { EnrichedStop } from "./enrichment";

/** A day within a trip, containing multiple items (activities) */
export interface TripDay {
  id: string;
  dateStart: string;
  dateEnd: string;
  name?: string;
  sortOrder: number;
  items: TripItem[];
}

/** An item (activity) within a day — same shape as EnrichedStop for map compatibility */
export interface TripItem extends EnrichedStop {
  id?: string;
  dayId?: string;
}

/** Full trip structure for display and editing */
export interface Trip {
  id: string;
  title: string;
  shareToken: string;
  createdAt?: string;
  updatedAt?: string;
  /** Hierarchical: days with items. Empty if legacy flat structure. */
  days: TripDay[];
  /** Flat list for backward compat and map display. Derived from days or legacy stops. */
  stops: EnrichedStop[];
}

/** Flatten trip days into stops for map/legacy consumers */
export function tripToStops(trip: Trip): EnrichedStop[] {
  if (trip.stops.length > 0) return trip.stops;
  return trip.days.flatMap((day) =>
    day.items.map((item) => ({
      ...item,
      dateStart: day.dateStart,
      dateEnd: day.dateEnd,
    }))
  );
}

/** Convert flat stops to days (for editing legacy trips) */
export function stopsToDays(stopList: EnrichedStop[]): TripDay[] {
  if (stopList.length === 0) return [];
  const byDate = new Map<string, EnrichedStop[]>();
  for (const stop of stopList) {
    const key = stop.dateStart ?? "undated";
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(stop);
  }
  const sortedDates = Array.from(byDate.keys()).sort((a, b) => {
    if (a === "undated") return 1;
    if (b === "undated") return -1;
    return a.localeCompare(b);
  });
  return sortedDates.map((date, i) => {
    const items = byDate.get(date)!;
    const dateEnd = items[0]?.dateEnd ?? items[0]?.dateStart ?? date;
    return {
      id: `day-${i}`,
      dateStart: date === "undated" ? "" : date,
      dateEnd: date === "undated" ? "" : dateEnd,
      sortOrder: i,
      items: items.map((s) => ({ ...s } as TripItem)),
    };
  });
}
