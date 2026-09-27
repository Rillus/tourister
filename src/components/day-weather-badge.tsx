"use client";

import { useEffect, useState } from "react";
import type { DayWeather } from "@/services/weather";
import { hasValidCoordinates } from "@/lib/coordinates";

interface DayWeatherBadgeProps {
  date: string;
  latitude?: number;
  longitude?: number;
  compact?: boolean;
}

export function DayWeatherBadge({
  date,
  latitude,
  longitude,
  compact,
}: DayWeatherBadgeProps) {
  const [weather, setWeather] = useState<DayWeather | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!hasValidCoordinates({ latitude, longitude })) {
      setWeather(null);
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      dates: date,
    });

    fetch(`/api/weather?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data: { days?: DayWeather[] }) => {
        if (!cancelled) {
          setWeather(data.days?.[0] ?? null);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [date, latitude, longitude]);

  if (!hasValidCoordinates({ latitude, longitude })) return null;
  if (error || !weather) {
    return compact ? null : (
      <p className="text-[11px] text-foreground/40">Weather loading…</p>
    );
  }

  const label =
    weather.kind === "forecast" ? "Forecast" : "Typical for date";

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] text-foreground/60"
        title={`${label}: ${weather.summary}, ${weather.tempMinC}–${weather.tempMaxC}°C`}
      >
        <span aria-hidden>{weatherIcon(weather.weatherCode)}</span>
        {Math.round(weather.tempMinC)}–{Math.round(weather.tempMaxC)}°
      </span>
    );
  }

  return (
    <div className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-3 py-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-foreground/80">
          <span aria-hidden className="mr-1">
            {weatherIcon(weather.weatherCode)}
          </span>
          {weather.summary}
        </span>
        <span className="text-foreground/50 shrink-0">{label}</span>
      </div>
      <p className="mt-1 text-foreground/70">
        {weather.tempMinC}–{weather.tempMaxC}°C
        {weather.precipitationMm > 0.5
          ? ` · ~${weather.precipitationMm} mm rain`
          : " · Low rain chance"}
      </p>
      <p className="mt-1 text-[10px] text-foreground/35">
        Weather data by Open-Meteo.com
      </p>
    </div>
  );
}

function weatherIcon(code: number): string {
  if (code === 0 || code === 1) return "☀";
  if (code === 2 || code === 3) return "☁";
  if (code >= 51 && code < 70) return "🌧";
  if (code >= 71 && code < 80) return "❄";
  if (code >= 80) return "⛈";
  return "🌤";
}
