"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import type { Trip, TripDay, TripItem } from "@/types/trip";
import { MapPicker } from "./map-picker";
import { TripCalendar } from "./trip-calendar";
import { DayPlotter } from "./day-plotter";
import type { SaveStatus } from "@/lib/auto-save";

interface TripEditorProps {
  trip: Trip;
  onSave: (updated: {
    title: string;
    days: TripDay[];
    password?: string;
  }) => void;
  /** Fired on every draft change (marks unsaved; does not persist) */
  onChange?: (updated: {
    title: string;
    days: TripDay[];
    password?: string;
  }) => void;
  /** Persist after a field blur or discrete action */
  onBlurSave?: () => void;
  isSaving: boolean;
  saveStatus?: SaveStatus;
}

function ensureDayForDate(days: TripDay[], date: string): TripDay[] {
  const existing = days.find((d) => d.dateStart === date);
  if (existing) return days;
  return [
    ...days,
    {
      id: `new-${date}-${Date.now()}`,
      dateStart: date,
      dateEnd: date,
      sortOrder: days.length,
      items: [],
    },
  ].sort((a, b) => a.dateStart.localeCompare(b.dateStart));
}

export function TripEditor({
  trip,
  onSave,
  onChange,
  onBlurSave,
  isSaving,
  saveStatus,
}: TripEditorProps) {
  const [title, setTitle] = useState(trip.title);
  const [password, setPassword] = useState("");
  const [days, setDays] = useState<TripDay[]>(
    trip.days.length > 0
      ? trip.days
      : [
          {
            id: "new-1",
            dateStart: "",
            dateEnd: "",
            sortOrder: 0,
            items: [],
          },
        ]
  );
  const readyRef = useRef(false);
  useEffect(() => {
    readyRef.current = true;
  }, []);

  const emitChange = useCallback(
    (next: { title: string; days: TripDay[]; password: string }) => {
      if (!readyRef.current || !onChange) return;
      const validDays = next.days
        .filter((d) => d.dateStart || d.items.length > 0)
        .map((d, i) => ({ ...d, sortOrder: i }));
      if (validDays.length === 0) return;
      onChange({
        title: next.title.trim() || trip.title,
        days: validDays,
        password: next.password.trim() || undefined,
      });
    },
    [onChange, trip.title]
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const first = trip.days.find((d) => d.dateStart)?.dateStart;
    return first ?? null;
  });
  const [pickingFor, setPickingFor] = useState<{
    dayIndex: number;
    itemIndex: number;
  } | null>(null);

  const selectedDayIndex = useMemo(() => {
    if (!selectedDate) return -1;
    return days.findIndex((d) => d.dateStart === selectedDate);
  }, [days, selectedDate]);

  const selectedDay =
    selectedDayIndex >= 0 ? days[selectedDayIndex] : null;

  const handleSelectDate = useCallback(
    (date: string) => {
      setDays((prev) => {
        const next = ensureDayForDate(prev, date);
        emitChange({ title, days: next, password });
        return next;
      });
      setSelectedDate(date);
    },
    [emitChange, title, password]
  );

  const updateSelectedDay = useCallback(
    (updater: (d: TripDay) => TripDay) => {
      if (selectedDayIndex < 0) return;
      setDays((prev) => {
        const next = [...prev];
        next[selectedDayIndex] = updater(next[selectedDayIndex]);
        emitChange({ title, days: next, password });
        return next;
      });
    },
    [selectedDayIndex, emitChange, title, password]
  );

  const mapPickerContext = useMemo(() => {
    if (!pickingFor) return null;
    const { dayIndex, itemIndex } = pickingFor;
    const item = days[dayIndex]?.items[itemIndex];
    if (!item) return null;

    const otherItems = days.flatMap((d, di) =>
      d.items
        .map((it, ii) => ({ item: it, dayIndex: di, itemIndex: ii }))
        .filter(
          ({ dayIndex: di, itemIndex: ii }) =>
            di !== dayIndex || ii !== itemIndex
        )
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

    return { item, dayIndex, itemIndex, initialCenter };
  }, [pickingFor, days]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validDays = days
      .filter((d) => d.dateStart || d.items.length > 0)
      .map((d, i) => ({ ...d, sortOrder: i }));
    if (validDays.length === 0) return;
    onSave({
      title: title.trim() || trip.title,
      days: validDays,
      password: password.trim() || undefined,
    });
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
          onChange={(e) => {
            const next = e.target.value;
            setTitle(next);
            emitChange({ title: next, days, password });
          }}
          onBlur={() => onBlurSave?.()}
          className="w-full rounded-lg border border-foreground/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      <div>
        <label
          htmlFor="edit-trip-password"
          className="block text-sm font-medium mb-1.5"
        >
          Trip password
        </label>
        <input
          id="edit-trip-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            const next = e.target.value;
            setPassword(next);
            emitChange({ title, days, password: next });
          }}
          onBlur={() => onBlurSave?.()}
          placeholder="Leave blank to keep the current password"
          className="w-full rounded-lg border border-foreground/15 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder:text-foreground/30"
        />
        <p className="mt-1.5 text-xs text-foreground/40">
          Optional. Enter a new password only if you want to change it.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(260px,320px)_1fr] lg:items-start">
        <TripCalendar
          days={days}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />

        {selectedDate && selectedDay ? (
          <DayPlotter
            date={selectedDate}
            dayName={selectedDay.name}
            items={selectedDay.items}
            onChangeItems={(items: TripItem[]) =>
              updateSelectedDay((d) => ({ ...d, items }))
            }
            onDayNameChange={(name) =>
              updateSelectedDay((d) => ({ ...d, name: name || undefined }))
            }
            onSetLocation={(itemIndex) =>
              setPickingFor({ dayIndex: selectedDayIndex, itemIndex })
            }
          />
        ) : (
          <div className="rounded-xl border border-dashed border-foreground/15 p-8 text-center text-sm text-foreground/50">
            Select a day on the calendar to plot activities
          </div>
        )}
      </div>

      <div className="flex gap-3 items-center">
        <button
          type="submit"
          disabled={isSaving || saveStatus === "saving"}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving || saveStatus === "saving" ? "Saving…" : "Save & view map"}
        </button>
        {saveStatus === "pending" && (
          <button
            type="button"
            onClick={() => onBlurSave?.()}
            className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600 cursor-pointer"
          >
            Save
          </button>
        )}
        {saveStatus === "saved" && (
          <span className="text-xs text-foreground/40 shrink-0">Saved</span>
        )}
        {saveStatus === "error" && (
          <button
            type="button"
            onClick={() => onBlurSave?.()}
            className="text-xs text-red-600 underline cursor-pointer"
          >
            Retry save
          </button>
        )}
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
          initialQuery={mapPickerContext.item.name}
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
            setDays((prev) => {
              const next = [...prev];
              const day = next[mapPickerContext.dayIndex];
              const items = [...day.items];
              items[mapPickerContext.itemIndex] = {
                ...items[mapPickerContext.itemIndex],
                latitude: lat,
                longitude: lon,
              };
              next[mapPickerContext.dayIndex] = { ...day, items };
              emitChange({ title, days: next, password });
              return next;
            });
            setPickingFor(null);
            onBlurSave?.();
          }}
          onCancel={() => setPickingFor(null)}
        />
      )}
    </form>
  );
}
