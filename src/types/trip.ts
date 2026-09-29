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

/** Compare HH:mm times; missing times sort after timed ones */
export function compareStartTimes(
  a: string | undefined,
  b: string | undefined
): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}

/** Sort items by startTime then leave relative order for ties / untimed */
export function sortItemsByTime<T extends { startTime?: string }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => compareStartTimes(a.startTime, b.startTime));
}

/** Flatten trip days into stops for map/legacy consumers */
export function tripToStops(trip: Trip): EnrichedStop[] {
  if (trip.stops.length > 0) return trip.stops;
  return trip.days.flatMap((day) =>
    sortItemsByTime(day.items).map((item) => ({
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
    const items = sortItemsByTime(byDate.get(date)!);
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

/**
 * Replace all items for a calendar day in a flat stop list.
 * Other days are left intact; missing days are appended.
 */
export function replaceDayItems(
  stops: EnrichedStop[],
  date: string,
  items: TripItem[]
): EnrichedStop[] {
  const days = stopsToDays(stops);
  const nextItems = items.map((item) => ({
    ...item,
    dateStart: date,
    dateEnd: item.dateEnd ?? date,
  }));
  const idx = days.findIndex((d) => d.dateStart === date);
  if (idx >= 0) {
    days[idx] = { ...days[idx], items: nextItems };
  } else {
    days.push({
      id: `day-${date}`,
      dateStart: date,
      dateEnd: date,
      sortOrder: days.length,
      items: nextItems,
    });
  }
  days.sort((a, b) => {
    if (!a.dateStart) return 1;
    if (!b.dateStart) return -1;
    return a.dateStart.localeCompare(b.dateStart);
  });
  return days.flatMap((day) =>
    sortItemsByTime(day.items).map((item) => ({
      ...item,
      dateStart: day.dateStart,
      dateEnd: day.dateEnd || day.dateStart,
    }))
  );
}

/** Earliest and latest YYYY-MM-DD across days (ignores empty) */
export function tripDateRange(days: TripDay[]): {
  start: string | null;
  end: string | null;
} {
  const dates = days
    .flatMap((d) => [d.dateStart, d.dateEnd])
    .filter((d) => !!d)
    .sort();
  if (dates.length === 0) return { start: null, end: null };
  return { start: dates[0], end: dates[dates.length - 1] };
}
