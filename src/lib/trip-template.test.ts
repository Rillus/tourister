import { describe, it, expect } from "vitest";
import { tripToTemplateText, templateFilename } from "./trip-template";
import type { Trip } from "@/types/trip";

const sampleTrip: Trip = {
  id: "1",
  title: "Japan 2026",
  shareToken: "abc",
  days: [
    {
      id: "d1",
      dateStart: "2026-11-13",
      dateEnd: "2026-11-13",
      name: "Arrival",
      sortOrder: 0,
      items: [
        {
          name: "Tokyo Haneda",
          notes: "Land at HND T3",
          startTime: "10:25",
        },
        {
          name: "Hotel Amanek Shinjuku",
          notes: "Check-in",
          startTime: "15:00",
        },
      ],
    },
    {
      id: "d2",
      dateStart: "2026-11-14",
      dateEnd: "2026-11-14",
      sortOrder: 1,
      items: [{ name: "Shibuya", notes: "Explore" }],
    },
  ],
  stops: [],
};

describe("tripToTemplateText", () => {
  it("exports a pasteable itinerary with title and timed events", () => {
    const text = tripToTemplateText(sampleTrip);
    expect(text).toContain("# Japan 2026");
    expect(text).toContain(
      "Day 1 (13 Nov 2026) - Tokyo Haneda - Land at HND T3 ~10:25"
    );
    expect(text).toContain(
      "Day 1 (13 Nov 2026) - Hotel Amanek Shinjuku - Check-in ~15:00"
    );
    expect(text).toContain("Day 2 (14 Nov 2026) - Shibuya - Explore");
  });

  it("falls back to flat stops when days are empty", () => {
    const trip: Trip = {
      id: "2",
      title: "Quick trip",
      shareToken: "x",
      days: [],
      stops: [
        {
          name: "Kyoto",
          dateStart: "2026-11-20",
          dateEnd: "2026-11-20",
          notes: "Temples",
        },
      ],
    };
    const text = tripToTemplateText(trip);
    expect(text).toContain("# Quick trip");
    expect(text).toContain("Day 1 (20 Nov 2026) - Kyoto - Temples");
  });

  it("adds a filename-friendly slug", () => {
    expect(templateFilename("Japan 2026!")).toBe("japan-2026-template.txt");
  });
});
