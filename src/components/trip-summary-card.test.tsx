import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { TripSummaryCard } from "./trip-summary-card";
import type { EnrichedStop } from "@/types/enrichment";

vi.mock("./day-weather-badge", () => ({
  DayWeatherBadge: ({ date }: { date: string }) => (
    <div data-testid="weather-badge">Weather for {date}</div>
  ),
}));

const stops: EnrichedStop[] = [
  {
    name: "Shibuya",
    latitude: 35.66,
    longitude: 139.7,
    dateStart: "2026-11-13",
    dateEnd: "2026-11-13",
  },
  {
    name: "Kyoto",
    latitude: 35.01,
    longitude: 135.77,
    dateStart: "2026-11-20",
    dateEnd: "2026-11-20",
  },
];

describe("TripSummaryCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows title, date range and stop count", () => {
    render(
      <TripSummaryCard
        title="Japan 2026"
        stops={stops}
        activeDay="all"
      />
    );
    expect(screen.getByText("Japan 2026")).toBeInTheDocument();
    expect(screen.getByText(/13–20 Nov 2026/)).toBeInTheDocument();
    expect(screen.getByText(/2 stops/)).toBeInTheDocument();
  });

  it("shows weather for the active day", () => {
    render(
      <TripSummaryCard
        title="Japan 2026"
        stops={stops}
        activeDay="2026-11-20"
      />
    );
    expect(screen.getByTestId("weather-badge")).toHaveTextContent(
      "Weather for 2026-11-20"
    );
  });

  it("falls back to first dated stop weather when viewing all days", () => {
    render(
      <TripSummaryCard title="Japan 2026" stops={stops} activeDay="all" />
    );
    expect(screen.getByTestId("weather-badge")).toHaveTextContent(
      "Weather for 2026-11-13"
    );
  });
});
