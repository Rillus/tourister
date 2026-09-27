import { describe, it, expect } from "vitest";
import {
  monthCells,
  datesWithItems,
  parseYearMonth,
  shiftMonth,
} from "./trip-calendar-utils";

describe("parseYearMonth", () => {
  it("parses YYYY-MM-DD into year and month", () => {
    expect(parseYearMonth("2026-11-13")).toEqual({ year: 2026, month: 11 });
  });
});

describe("shiftMonth", () => {
  it("moves forward and wraps year", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
});

describe("monthCells", () => {
  it("returns 35 or 42 cells covering the month", () => {
    const cells = monthCells(2026, 11);
    expect(cells.length).toBeGreaterThanOrEqual(35);
    expect(cells.some((c) => c.date === "2026-11-01")).toBe(true);
    expect(cells.some((c) => c.date === "2026-11-30")).toBe(true);
    const firstOfMonth = cells.find((c) => c.date === "2026-11-01");
    expect(firstOfMonth?.inMonth).toBe(true);
  });

  it("marks days outside the displayed month", () => {
    const cells = monthCells(2026, 11);
    const outside = cells.filter((c) => !c.inMonth);
    expect(outside.length).toBeGreaterThan(0);
  });
});

describe("datesWithItems", () => {
  it("collects dates that have at least one item", () => {
    const set = datesWithItems([
      {
        id: "1",
        dateStart: "2026-11-13",
        dateEnd: "2026-11-13",
        sortOrder: 0,
        items: [{ name: "A", latitude: 0, longitude: 0 }],
      },
      {
        id: "2",
        dateStart: "2026-11-14",
        dateEnd: "2026-11-14",
        sortOrder: 1,
        items: [],
      },
    ]);
    expect(set.has("2026-11-13")).toBe(true);
    expect(set.has("2026-11-14")).toBe(false);
  });
});
