import { describe, it, expect, beforeEach } from "vitest";
import {
  getSavedTripTokens,
  addSavedTripToken,
  removeSavedTripToken,
} from "./saved-trips";

describe("saved-trips", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty array when no tokens saved", () => {
    expect(getSavedTripTokens()).toEqual([]);
  });

  it("adds and retrieves tokens", () => {
    addSavedTripToken("abc123");
    expect(getSavedTripTokens()).toEqual(["abc123"]);

    addSavedTripToken("def456");
    expect(getSavedTripTokens()).toEqual(["def456", "abc123"]);
  });

  it("moves existing token to front when re-added", () => {
    addSavedTripToken("first");
    addSavedTripToken("second");
    addSavedTripToken("first");
    expect(getSavedTripTokens()).toEqual(["first", "second"]);
  });

  it("removes token", () => {
    addSavedTripToken("abc");
    addSavedTripToken("def");
    removeSavedTripToken("abc");
    expect(getSavedTripTokens()).toEqual(["def"]);
  });
});
