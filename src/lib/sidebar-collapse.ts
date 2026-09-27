const STORAGE_KEY = "tourister_map_sidebar_collapsed";

export type SidebarSectionId = "summary" | "calendar" | "stops";

export type SidebarCollapsedState = Record<SidebarSectionId, boolean>;

const DEFAULTS: SidebarCollapsedState = {
  summary: false,
  calendar: false,
  stops: false,
};

function isSectionId(key: string): key is SidebarSectionId {
  return key === "summary" || key === "calendar" || key === "stops";
}

export function getSidebarCollapsed(): SidebarCollapsedState {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const state = { ...DEFAULTS };
    for (const [key, value] of Object.entries(parsed)) {
      if (isSectionId(key) && typeof value === "boolean") {
        state[key] = value;
      }
    }
    return state;
  } catch {
    return { ...DEFAULTS };
  }
}

export function setSidebarSectionCollapsed(
  id: SidebarSectionId,
  collapsed: boolean
): void {
  if (typeof window === "undefined") return;
  try {
    const next = { ...getSidebarCollapsed(), [id]: collapsed };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}
