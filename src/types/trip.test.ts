import { describe, it, expect } from "vitest";
import { tripToStops, stopsToDays } from "./trip";
import type { Trip, TripDay } from "./trip";

describe("tripToStops", () => {
  it("returns flat stops when trip has stops", () => {
    const trip: Trip = {
      id: "1",
      title: "Test",
      shareToken: "abc",
      days: [],
      stops: [
        {
          name: "Tokyo",
          latitude: 35.6,
          longitude: 139.6,
          dateStart: "2026-11-01",
          dateEnd: "2026-11-03",
        },
      ],
    };

    expect(tripToStops(trip)).toHaveLength(1);
    expect(tripToStops(trip)[0].name).toBe("Tokyo");
    expect(tripToStops(trip)[0].dateStart).toBe("2026-11-01");
  });

  it("flattens days and items when trip has no flat stops", () => {
    const day: TripDay = {
      id: "d1",
      dateStart: "2026-11-01",
      dateEnd: "2026-11-03",
      name: "Tokyo",
      sortOrder: 0,
      items: [
        {
          name: "Shibuya",
          latitude: 35.66,
          longitude: 139.7,
        },
        {
          name: "Harajuku",
          latitude: 35.67,
          longitude: 139.7,
        },
      ],
    };

    const trip: Trip = {
      id: "1",
      title: "Test",
      shareToken: "abc",
      days: [day],
      stops: [],
    };

    const stops = tripToStops(trip);
    expect(stops).toHaveLength(2);
    expect(stops[0].name).toBe("Shibuya");
    expect(stops[0].dateStart).toBe("2026-11-01");
    expect(stops[0].dateEnd).toBe("2026-11-03");
    expect(stops[1].name).toBe("Harajuku");
  });

  it("returns empty when trip has no stops and no days", () => {
    const trip: Trip = {
      id: "1",
      title: "Empty",
      shareToken: "x",
      days: [],
      stops: [],
    };
    expect(tripToStops(trip)).toEqual([]);
  });

  it("prefers flat stops over days when both present", () => {
    const trip: Trip = {
      id: "1",
      title: "Test",
      shareToken: "abc",
      days: [
        {
          id: "d1",
          dateStart: "2026-11-01",
          dateEnd: "2026-11-01",
          sortOrder: 0,
          items: [{ name: "A", latitude: 0, longitude: 0 }],
        },
      ],
      stops: [{ name: "Legacy", latitude: 1, longitude: 1 }],
    };

    const stops = tripToStops(trip);
    expect(stops).toHaveLength(1);
    expect(stops[0].name).toBe("Legacy");
  });
});

describe("stopsToDays", () => {
  it("groups stops by dateStart", () => {
    const stops = [
      { name: "A", latitude: 0, longitude: 0, dateStart: "2026-11-02" },
      { name: "B", latitude: 0, longitude: 0, dateStart: "2026-11-01" },
      { name: "C", latitude: 0, longitude: 0, dateStart: "2026-11-01" },
    ];
    const result = stopsToDays(stops);
    expect(result).toHaveLength(2);
    expect(result[0].dateStart).toBe("2026-11-01");
    expect(result[0].items).toHaveLength(2);
    expect(result[1].dateStart).toBe("2026-11-02");
    expect(result[1].items).toHaveLength(1);
  });

  it("returns empty for empty stops", () => {
    expect(stopsToDays([])).toEqual([]);
  });

  it("handles undated stops", () => {
    const stops = [
      { name: "X", latitude: 0, longitude: 0 },
    ];
    const result = stopsToDays(stops);
    expect(result).toHaveLength(1);
    expect(result[0].dateStart).toBe("");
    expect(result[0].items[0].name).toBe("X");
  });
});
