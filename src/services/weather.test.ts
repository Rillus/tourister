import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  classifyWeatherKind,
  FORECAST_HORIZON_DAYS,
  summariseWeatherCode,
  fetchDayWeather,
} from "./weather";

describe("classifyWeatherKind", () => {
  it("uses forecast within the horizon", () => {
    expect(classifyWeatherKind("2026-10-01", new Date("2026-09-27"))).toBe(
      "forecast"
    );
  });

  it("uses average beyond the horizon", () => {
    const far = new Date("2026-09-27");
    far.setDate(far.getDate() + FORECAST_HORIZON_DAYS + 5);
    const iso = far.toISOString().slice(0, 10);
    expect(classifyWeatherKind(iso, new Date("2026-09-27"))).toBe("average");
  });

  it("uses average for past dates outside recent forecast window", () => {
    expect(classifyWeatherKind("2020-01-01", new Date("2026-09-27"))).toBe(
      "average"
    );
  });
});

describe("summariseWeatherCode", () => {
  it("maps clear and rain codes", () => {
    expect(summariseWeatherCode(0)).toMatch(/clear/i);
    expect(summariseWeatherCode(61)).toMatch(/rain/i);
  });
});

describe("fetchDayWeather", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns forecast data for near dates", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        daily: {
          time: ["2026-09-28"],
          temperature_2m_max: [22.1],
          temperature_2m_min: [14.3],
          precipitation_sum: [0.2],
          weathercode: [1],
        },
      }),
    } as Response);

    const result = await fetchDayWeather({
      latitude: 35.66,
      longitude: 139.7,
      dates: ["2026-09-28"],
      today: new Date("2026-09-27"),
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      date: "2026-09-28",
      kind: "forecast",
      tempMaxC: 22.1,
      tempMinC: 14.3,
    });
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain(
      "api.open-meteo.com/v1/forecast"
    );
  });

  it("returns climate averages for far dates", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        daily: {
          time: [
            "2018-11-13",
            "2019-11-13",
            "2020-11-13",
            "2021-11-13",
            "2022-11-13",
          ],
          temperature_2m_max: [16, 18, 17, 15, 19],
          temperature_2m_min: [8, 9, 7, 8, 10],
          precipitation_sum: [1, 0, 2, 0, 5],
          weathercode: [61, 1, 61, 0, 3],
        },
      }),
    } as Response);

    const result = await fetchDayWeather({
      latitude: 35.66,
      longitude: 139.7,
      dates: ["2026-11-13"],
      today: new Date("2026-09-27"),
    });

    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("average");
    expect(result[0].tempMaxC).toBe(17);
    expect(result[0].tempMinC).toBe(8.4);
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain("archive-api.open-meteo.com");
  });
});
