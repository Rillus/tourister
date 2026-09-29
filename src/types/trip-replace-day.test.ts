import { describe, it, expect } from "vitest";
import { replaceDayItems } from "@/types/trip";
import type { EnrichedStop } from "@/types/enrichment";
import type { TripItem } from "@/types/trip";

const stops: EnrichedStop[] = [
  {
    name: "Shibuya",
    latitude: 35.66,
    longitude: 139.7,
    dateStart: "2026-11-13",
    dateEnd: "2026-11-13",
    startTime: "10:00",
  },
  {
    name: "Osaka",
    latitude: 34.7,
    longitude: 135.5,
    dateStart: "2026-11-16",
    dateEnd: "2026-11-16",
  },
];

describe("replaceDayItems", () => {
  it("replaces all stops for a day while keeping other days", () => {
    const items: TripItem[] = [
      {
        name: "Shinjuku",
        latitude: 35.69,
        longitude: 139.7,
        startTime: "11:00",
      },
      {
        name: "The Bay Window",
        latitude: 0,
        longitude: 0,
        startTime: "19:00",
        notes: "Drinks",
      },
    ];

    const next = replaceDayItems(stops, "2026-11-13", items);

    expect(next.filter((s) => s.dateStart === "2026-11-13")).toHaveLength(2);
    expect(next.find((s) => s.name === "Shinjuku")?.startTime).toBe("11:00");
    expect(next.find((s) => s.name === "Osaka")).toBeTruthy();
    expect(next.find((s) => s.name === "Shibuya")).toBeUndefined();
  });

  it("adds a new day when the date had no stops", () => {
    const items: TripItem[] = [
      {
        name: "Ginza",
        latitude: 35.67,
        longitude: 139.76,
        startTime: "10:00",
      },
    ];

    const next = replaceDayItems(stops, "2026-11-14", items);
    expect(next.find((s) => s.dateStart === "2026-11-14")?.name).toBe("Ginza");
    expect(next).toHaveLength(3);
  });
});
