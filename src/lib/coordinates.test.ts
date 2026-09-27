import { describe, it, expect } from "vitest";
import { hasValidCoordinates } from "./coordinates";

describe("hasValidCoordinates", () => {
  it("returns true for real coordinates", () => {
    expect(hasValidCoordinates({ latitude: 35.66, longitude: 139.7 })).toBe(
      true
    );
  });

  it("returns false for 0,0 (unmapped placeholder)", () => {
    expect(hasValidCoordinates({ latitude: 0, longitude: 0 })).toBe(false);
  });

  it("returns false for missing or NaN", () => {
    expect(hasValidCoordinates({ latitude: NaN, longitude: 139 })).toBe(false);
    expect(
      hasValidCoordinates({
        latitude: undefined as unknown as number,
        longitude: 139,
      })
    ).toBe(false);
  });

  it("allows a real location near null island if only one axis is zero", () => {
    // Gulf of Guinea coast / equator crossings can be 0 lat with real lon
    expect(hasValidCoordinates({ latitude: 0, longitude: -0.1 })).toBe(true);
    expect(hasValidCoordinates({ latitude: 0.1, longitude: 0 })).toBe(true);
  });
});
