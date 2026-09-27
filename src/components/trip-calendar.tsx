"use client";

import { useMemo, useState } from "react";
import type { TripDay } from "@/types/trip";
import { tripDateRange } from "@/types/trip";
import {
  datesWithItems,
  monthCells,
  parseYearMonth,
  shiftMonth,
} from "./trip-calendar-utils";
import { DayWeatherBadge } from "./day-weather-badge";
import { hasValidCoordinates } from "@/lib/coordinates";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface TripCalendarProps {
  days: TripDay[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  /** Show compact weather under the grid (default true) */
  showWeather?: boolean;
}

export function TripCalendar({
  days,
  selectedDate,
  onSelectDate,
  showWeather = true,
}: TripCalendarProps) {
  const range = tripDateRange(days);
  const initial = selectedDate
    ? parseYearMonth(selectedDate)
    : range.start
      ? parseYearMonth(range.start)
      : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };

  const [view, setView] = useState(initial);
  const cells = useMemo(
    () => monthCells(view.year, view.month),
    [view.year, view.month]
  );
  const withItems = useMemo(() => datesWithItems(days), [days]);
  const dayDates = useMemo(
    () => new Set(days.map((d) => d.dateStart).filter(Boolean)),
    [days]
  );

  const selectedWeatherAnchor = useMemo(() => {
    if (!selectedDate) return null;
    const day = days.find((d) => d.dateStart === selectedDate);
    return day?.items.find(hasValidCoordinates) ?? null;
  }, [days, selectedDate]);

  const label = new Date(Date.UTC(view.year, view.month - 1, 1)).toLocaleDateString(
    "en-GB",
    { month: "long", year: "numeric", timeZone: "UTC" }
  );

  return (
    <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setView((v) => shiftMonth(v.year, v.month, -1))}
          className="rounded px-2 py-1 text-sm text-foreground/60 hover:bg-foreground/5"
        >
          ‹
        </button>
        <h3 className="text-sm font-semibold">{label}</h3>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setView((v) => shiftMonth(v.year, v.month, 1))}
          className="rounded px-2 py-1 text-sm text-foreground/60 hover:bg-foreground/5"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-medium text-foreground/40 uppercase"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1" role="grid" aria-label="Trip calendar">
        {cells.map((cell) => {
          const selected = cell.date === selectedDate;
          const hasItems = withItems.has(cell.date);
          const inTrip = dayDates.has(cell.date);
          return (
            <button
              key={cell.date}
              type="button"
              role="gridcell"
              aria-selected={selected}
              aria-label={cell.date}
              onClick={() => onSelectDate(cell.date)}
              className={`relative aspect-square rounded-lg text-sm transition cursor-pointer
                ${cell.inMonth ? "text-foreground" : "text-foreground/30"}
                ${selected ? "bg-blue-600 text-white" : "hover:bg-foreground/5"}
                ${inTrip && !selected ? "ring-1 ring-blue-500/30" : ""}
              `}
            >
              {cell.day}
              {hasItems && (
                <span
                  className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full ${
                    selected ? "bg-white" : "bg-blue-600"
                  }`}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      {showWeather && selectedDate && selectedWeatherAnchor && (
        <div className="mt-3 pt-2 border-t border-foreground/10">
          <DayWeatherBadge
            date={selectedDate}
            latitude={selectedWeatherAnchor.latitude}
            longitude={selectedWeatherAnchor.longitude}
            compact
          />
        </div>
      )}
    </div>
  );
}
