import { describe, it, expect } from "vitest";
import {
  tripToStops,
  stopsToDays,
  sortItemsByTime,
  compareStartTimes,
  tripDateRange,
} from "./trip";
import type { Trip, TripDay } from "./trip";

describe("compareStartTimes", () => {
  it("orders earlier times first", () => {
    expect(compareStartTimes("09:00", "14:00")).toBeLessThan(0);
    expect(compareStartTimes("14:00", "09:00")).toBeGreaterThan(0);
  });

  it("puts untimed after timed", () => {
    expect(compareStartTimes(undefined, "10:00")).toBeGreaterThan(0);
    expect(compareStartTimes("10:00", undefined)).toBeLessThan(0);
  });
});

describe("sortItemsByTime", () => {
  it("sorts by startTime with untimed last", () => {
    const items = [
      { name: "C", startTime: "15:00" },
      { name: "A", startTime: "09:00" },
      { name: "B" },
      { name: "D", startTime: "12:00" },
    ];
    expect(sortItemsByTime(items).map((i) => i.name)).toEqual([
      "A",
      "D",
      "C",
      "B",
    ]);
  });
});

describe("tripDateRange", () => {
  it("returns nulls for empty days", () => {
    expect(tripDateRange([])).toEqual({ start: null, end: null });
  });

  it("returns earliest start and latest end", () => {
    const days: TripDay[] = [
      {
        id: "1",
        dateStart: "2026-11-16",
        dateEnd: "2026-11-16",
        sortOrder: 0,
        items: [],
      },
      {
        id: "2",
        dateStart: "2026-11-13",
        dateEnd: "2026-11-15",
        sortOrder: 1,
        items: [],
      },
    ];
    expect(tripDateRange(days)).toEqual({
      start: "2026-11-13",
      end: "2026-11-16",
    });
  });
});

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

  it("preserves startTime when flattening days", () => {
    const trip: Trip = {
      id: "1",
      title: "Test",
      shareToken: "abc",
      days: [
        {
          id: "d1",
          dateStart: "2026-11-14",
          dateEnd: "2026-11-14",
          sortOrder: 0,
          items: [
            {
              name: "teamLab",
              latitude: 0,
              longitude: 0,
              startTime: "10:00",
              endTime: "12:00",
            },
          ],
        },
      ],
      stops: [],
    };
    const stops = tripToStops(trip);
    expect(stops[0].startTime).toBe("10:00");
    expect(stops[0].endTime).toBe("12:00");
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
    const stops = [{ name: "X", latitude: 0, longitude: 0 }];
    const result = stopsToDays(stops);
    expect(result).toHaveLength(1);
    expect(result[0].dateStart).toBe("");
    expect(result[0].items[0].name).toBe("X");
  });

  it("sorts items by startTime within a day", () => {
    const stops = [
      {
        name: "Dinner",
        latitude: 0,
        longitude: 0,
        dateStart: "2026-11-13",
        startTime: "19:00",
      },
      {
        name: "Lunch",
        latitude: 0,
        longitude: 0,
        dateStart: "2026-11-13",
        startTime: "12:00",
      },
    ];
    const result = stopsToDays(stops);
    expect(result[0].items.map((i) => i.name)).toEqual(["Lunch", "Dinner"]);
  });
});
