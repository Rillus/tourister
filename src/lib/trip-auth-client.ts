const STORAGE_PREFIX = "tourister_trip_pw_";

export function getStoredTripPassword(token: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(STORAGE_PREFIX + token);
  } catch {
    return null;
  }
}

export function storeTripPassword(token: string, password: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_PREFIX + token, password);
  } catch {
    // ignore quota / private mode
  }
}

export function clearTripPassword(token: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_PREFIX + token);
  } catch {
    // ignore
  }
}

export function tripPasswordHeaders(
  token: string,
  password?: string | null
): HeadersInit {
  const pw = password ?? getStoredTripPassword(token);
  if (!pw) return {};
  return { "X-Trip-Password": pw };
}
