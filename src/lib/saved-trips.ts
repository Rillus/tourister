const STORAGE_KEY = "tourister_saved_trips";
const MAX_SAVED = 50;

export function getSavedTripTokens(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addSavedTripToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    const tokens = getSavedTripTokens();
    const filtered = tokens.filter((t) => t !== token);
    const updated = [token, ...filtered].slice(0, MAX_SAVED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}

export function removeSavedTripToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    const tokens = getSavedTripTokens().filter((t) => t !== token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // Ignore
  }
}
