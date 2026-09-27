"use client";

import { useMemo } from "react";
import type { EnrichedStop } from "@/types/enrichment";
import { DayWeatherBadge } from "./day-weather-badge";
import { hasValidCoordinates } from "@/lib/coordinates";

interface TripSummaryCardProps {
  title: string;
  stops: EnrichedStop[];
  activeDay: "all" | string;
}

function formatRange(start: string, end: string): string {
  const startDate = new Date(start + "T12:00:00");
  const endDate = new Date(end + "T12:00:00");
  if (start === end) {
    return startDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  const sameMonth =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth();
  if (sameMonth) {
    return `${startDate.getDate()}–${endDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  }
  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const startLabel = startDate.toLocaleDateString(
    "en-GB",
    sameYear
      ? { day: "numeric", month: "short" }
      : { day: "numeric", month: "short", year: "numeric" }
  );
  const endLabel = endDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${startLabel}–${endLabel}`;
}

export function TripSummaryCard({
  title,
  stops,
  activeDay,
}: TripSummaryCardProps) {
  const dates = useMemo(() => {
    const set = new Set<string>();
    for (const s of stops) {
      if (s.dateStart) set.add(s.dateStart);
    }
    return Array.from(set).sort();
  }, [stops]);

  const weatherDate =
    activeDay !== "all"
      ? activeDay
      : dates[0] ?? null;

  const weatherAnchor = useMemo(() => {
    if (!weatherDate) return null;
    const onDay = stops.filter((s) => s.dateStart === weatherDate);
    return (
      onDay.find(hasValidCoordinates) ??
      stops.find(hasValidCoordinates) ??
      null
    );
  }, [stops, weatherDate]);

  const rangeLabel =
    dates.length > 0
      ? formatRange(dates[0], dates[dates.length - 1])
      : null;

  return (
    <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-3 space-y-2">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {title || "Trip"}
        </h3>
        <p className="mt-0.5 text-xs text-foreground/50">
          {rangeLabel ? `${rangeLabel} · ` : ""}
          {stops.length} stop{stops.length !== 1 ? "s" : ""}
          {activeDay !== "all" && weatherDate
            ? ` · ${new Date(weatherDate + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
            : ""}
        </p>
      </div>
      {weatherDate && weatherAnchor && (
        <DayWeatherBadge
          date={weatherDate}
          latitude={weatherAnchor.latitude}
          longitude={weatherAnchor.longitude}
        />
      )}
      {weatherDate && !weatherAnchor && (
        <p className="text-[11px] text-foreground/40">
          Drop a pin on a stop to see weather for this day.
        </p>
      )}
    </div>
  );
}
