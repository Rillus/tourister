import { describe, it, expect, beforeEach } from "vitest";
import {
  getSidebarCollapsed,
  setSidebarSectionCollapsed,
  type SidebarSectionId,
} from "./sidebar-collapse";

describe("sidebar-collapse", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults all sections to expanded", () => {
    expect(getSidebarCollapsed()).toEqual({
      summary: false,
      calendar: false,
      stops: false,
    });
  });

  it("persists a collapsed section to localStorage", () => {
    setSidebarSectionCollapsed("calendar", true);
    expect(getSidebarCollapsed().calendar).toBe(true);
    expect(getSidebarCollapsed().summary).toBe(false);
  });

  it("can expand a previously collapsed section", () => {
    setSidebarSectionCollapsed("stops", true);
    setSidebarSectionCollapsed("stops", false);
    expect(getSidebarCollapsed().stops).toBe(false);
  });

  it("ignores unknown keys in stored JSON", () => {
    localStorage.setItem(
      "tourister_map_sidebar_collapsed",
      JSON.stringify({ summary: true, nonsense: true })
    );
    const state = getSidebarCollapsed();
    expect(state.summary).toBe(true);
    expect(state.calendar).toBe(false);
    expect((state as Record<string, boolean>).nonsense).toBeUndefined();
  });

  it("accepts known section ids", () => {
    const ids: SidebarSectionId[] = ["summary", "calendar", "stops"];
    expect(ids).toHaveLength(3);
  });
});
