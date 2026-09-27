import { describe, it, expect } from "vitest";
import {
  minutesFromMidnight,
  blockStyle,
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
} from "./day-plotter-utils";

describe("minutesFromMidnight", () => {
  it("parses HH:mm", () => {
    expect(minutesFromMidnight("00:00")).toBe(0);
    expect(minutesFromMidnight("09:30")).toBe(9 * 60 + 30);
    expect(minutesFromMidnight("23:59")).toBe(23 * 60 + 59);
  });

  it("returns null for invalid", () => {
    expect(minutesFromMidnight(undefined)).toBeNull();
    expect(minutesFromMidnight("")).toBeNull();
    expect(minutesFromMidnight("25:00")).toBeNull();
  });
});

describe("blockStyle", () => {
  it("positions a timed block within the timeline", () => {
    const style = blockStyle("10:00", "12:00");
    expect(style).not.toBeNull();
    const totalMinutes =
      (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60;
    const expectedTop =
      ((10 * 60 - TIMELINE_START_HOUR * 60) / totalMinutes) * 100;
    expect(style!.topPercent).toBeCloseTo(expectedTop, 1);
    expect(style!.heightPercent).toBeGreaterThan(0);
  });

  it("uses a compact height when endTime is missing", () => {
    const style = blockStyle("10:00", undefined);
    expect(style).not.toBeNull();
    expect(style!.heightPercent).toBeLessThan(
      blockStyle("10:00", "14:00")!.heightPercent
    );
  });

  it("returns null without startTime", () => {
    expect(blockStyle(undefined, "12:00")).toBeNull();
  });
});
