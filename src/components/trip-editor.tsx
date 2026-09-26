"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import type { Trip, TripDay, TripItem } from "@/types/trip";
import { MapPicker } from "./map-picker";

interface TripEditorProps {
  trip: Trip;
  onSave: (updated: { title: string; days: TripDay[] }) => void;
  isSaving: boolean;
}

function formatShortDate(s: string): string {
  if (!s) return "";
  try {
    const d = new Date(s + "T12:00:00");
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return s;
  }
}

export function TripEditor({ trip, onSave, isSaving }: TripEditorProps) {
  const [title, setTitle] = useState(trip.title);
  const [days, setDays] = useState<TripDay[]>(
    trip.days.length > 0 ? trip.days : [{ id: "new-1", dateStart: "", dateEnd: "", sortOrder: 0, items: [] }]
  );
  const [pickingFor, setPickingFor] = useState<{
    dayIndex: number;
    itemIndex: number;
  } | null>(null);

  const updateDay = useCallback((index: number, updater: (d: TripDay) => TripDay) => {
    setDays((prev) => {
      const next = [...prev];
      next[index] = updater(next[index]);
      return next;
    });
  }, []);

  const addDay = useCallback(() => {
    setDays((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        dateStart: "",
        dateEnd: "",
        sortOrder: prev.length,
        items: [],
      },
    ]);
  }, []);

  const removeDay = useCallback((index: number) => {
    setDays((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addItem = useCallback(
    (dayIndex: number) => {
      updateDay(dayIndex, (d) => ({
        ...d,
        items: [
          ...d.items,
          { name: "", latitude: 0, longitude: 0 },
        ],
      }));
    },
    [updateDay]
  );

  const updateItem = useCallback(
    (dayIndex: number, itemIndex: number, updates: Partial<TripItem>) => {
      updateDay(dayIndex, (d) => {
        const items = [...d.items];
        items[itemIndex] = { ...items[itemIndex], ...updates };
        return { ...d, items };
      });
    },
    [updateDay]
  );

  const removeItem = useCallback(
    (dayIndex: number, itemIndex: number) => {
      updateDay(dayIndex, (d) => ({
        ...d,
        items: d.items.filter((_, i) => i !== itemIndex),
      }));
    },
    [updateDay]
  );

  const mapPickerContext = useMemo(() => {
    if (!pickingFor) return null;
    const { dayIndex, itemIndex } = pickingFor;
    const item = days[dayIndex]?.items[itemIndex];
    if (!item) return null;

    const otherItems = days.flatMap((d, di) =>
      d.items
        .map((it, ii) => ({ item: it, dayIndex: di, itemIndex: ii }))
        .filter(({ dayIndex: di, itemIndex: ii }) => di !== dayIndex || ii !== itemIndex)
    );
    const withCoords = otherItems.filter(
      ({ item: it }) =>
        it.latitude != null &&
        it.longitude != null &&
        (it.latitude !== 0 || it.longitude !== 0)
    );
    const initialCenter =
      withCoords.length > 0
        ? {
            lat:
              withCoords.reduce((s, { item: it }) => s + it.latitude, 0) /
              withCoords.length,
            lon:
              withCoords.reduce((s, { item: it }) => s + it.longitude, 0) /
              withCoords.length,
          }
        : { lat: 35.6762, lon: 139.6503 };

    return {
      item,
      dayIndex,
      itemIndex,
      initialCenter,
    };
  }, [pickingFor, days]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validDays = days.filter((d) => d.dateStart || d.items.length > 0);
    if (validDays.length === 0) return;
    onSave({ title: title.trim() || trip.title, days: validDays });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1.5">
          Trip title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-foreground/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Days & activities</h2>
          <button
            type="button"
            onClick={addDay}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add day
          </button>
        </div>

        <div className="space-y-4">
          {days.map((day, dayIndex) => (
            <div
              key={day.id}
              className="rounded-xl border border-foreground/10 bg-foreground/[0.02] overflow-hidden"
            >
              <div className="p-3 border-b border-foreground/10 flex flex-wrap gap-2 items-center">
                <input
                  type="date"
                  value={day.dateStart}
                  onChange={(e) =>
                    updateDay(dayIndex, (d) => ({
                      ...d,
                      dateStart: e.target.value,
                      dateEnd: d.dateEnd || e.target.value,
                    }))
                  }
                  className="rounded px-2 py-1 text-sm border border-foreground/15 bg-background"
                />
                <span className="text-foreground/40">→</span>
                <input
                  type="date"
                  value={day.dateEnd}
                  onChange={(e) =>
                    updateDay(dayIndex, (d) => ({ ...d, dateEnd: e.target.value }))
                  }
                  className="rounded px-2 py-1 text-sm border border-foreground/15 bg-background"
                />
                <input
                  type="text"
                  placeholder="Day name (e.g. Tokyo)"
                  value={day.name ?? ""}
                  onChange={(e) =>
                    updateDay(dayIndex, (d) => ({ ...d, name: e.target.value }))
                  }
                  className="flex-1 min-w-[120px] rounded px-2 py-1 text-sm border border-foreground/15 bg-background placeholder:text-foreground/30"
                />
                <button
                  type="button"
                  onClick={() => removeDay(dayIndex)}
                  className="text-foreground/40 hover:text-red-500 text-sm"
                  aria-label="Remove day"
                >
                  Remove
                </button>
              </div>
              <div className="p-3 space-y-2">
                {day.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="flex gap-2 items-start group"
                  >
                    <input
                      type="text"
                      placeholder="Activity name"
                      value={item.name}
                      onChange={(e) =>
                        updateItem(dayIndex, itemIndex, {
                          name: e.target.value,
                        })
                      }
                      className="flex-1 rounded px-3 py-2 text-sm border border-foreground/15 bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                    <input
                      type="text"
                      placeholder="Notes"
                      value={item.notes ?? ""}
                      onChange={(e) =>
                        updateItem(dayIndex, itemIndex, {
                          notes: e.target.value,
                        })
                      }
                      className="flex-1 rounded px-3 py-2 text-sm border border-foreground/15 bg-background focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPickingFor({ dayIndex, itemIndex })
                      }
                      className="opacity-0 group-hover:opacity-100 text-foreground/50 hover:text-blue-600 transition px-2"
                      aria-label="Set location on map"
                      title="Set location on map"
                    >
                      📍
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(dayIndex, itemIndex)}
                      className="opacity-0 group-hover:opacity-100 text-foreground/40 hover:text-red-500 transition px-2"
                      aria-label="Remove activity"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addItem(dayIndex)}
                  className="text-sm text-foreground/50 hover:text-blue-600"
                >
                  + Add activity
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving…" : "Save changes"}
        </button>
        <Link
          href="/trips"
          className="rounded-lg border border-foreground/15 px-4 py-2.5 text-sm font-medium hover:bg-foreground/5"
        >
          Cancel
        </Link>
      </div>

      {mapPickerContext && (
        <MapPicker
          initialCenter={mapPickerContext.initialCenter}
          latitude={
            mapPickerContext.item.latitude !== 0 ||
            mapPickerContext.item.longitude !== 0
              ? mapPickerContext.item.latitude
              : undefined
          }
          longitude={
            mapPickerContext.item.latitude !== 0 ||
            mapPickerContext.item.longitude !== 0
              ? mapPickerContext.item.longitude
              : undefined
          }
          onSelect={(lat, lon) => {
            updateItem(mapPickerContext.dayIndex, mapPickerContext.itemIndex, {
              latitude: lat,
              longitude: lon,
            });
            setPickingFor(null);
          }}
          onCancel={() => setPickingFor(null)}
        />
      )}
    </form>
  );
}
