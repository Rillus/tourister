import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DayWeatherBadge } from "./day-weather-badge";

describe("DayWeatherBadge", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders nothing without coordinates", () => {
    const { container } = render(
      <DayWeatherBadge date="2026-11-13" latitude={0} longitude={0} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows forecast weather from the API", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        days: [
          {
            date: "2026-09-28",
            kind: "forecast",
            tempMaxC: 22,
            tempMinC: 14,
            precipitationMm: 0,
            weatherCode: 0,
            summary: "Clear",
          },
        ],
      }),
    } as Response);

    render(
      <DayWeatherBadge date="2026-09-28" latitude={35.66} longitude={139.7} />
    );

    await waitFor(() => {
      expect(screen.getByText("Clear")).toBeInTheDocument();
    });
    expect(screen.getByText("Forecast")).toBeInTheDocument();
    expect(screen.getByText(/14–22°C/)).toBeInTheDocument();
  });
});
