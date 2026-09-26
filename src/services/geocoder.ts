import type { ParsedStop, GeocodedStop } from "@/types/itinerary";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Tourister/0.1 (travel itinerary app)";
const RATE_LIMIT_MS = 1100;

/** Max distance (km) from centroid of other pins — reject results that are clearly wrong */
const MAX_REASONABLE_DISTANCE_KM = 2500;

/** Padding (degrees) around existing bbox when biasing search */
const VIEWBOX_PADDING = 2;

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

export interface GeocodeOptions {
  /** Bias search to this area (lon1,lat1,lon2,lat2). Improves accuracy for ambiguous names. */
  viewbox?: { minLon: number; minLat: number; maxLon: number; maxLat: number };
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function geocodeLocation(
  query: string,
  options?: GeocodeOptions
): Promise<GeocodingResult | null> {
  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "3",
    });

    if (options?.viewbox) {
      const { minLon, minLat, maxLon, maxLat } = options.viewbox;
      params.set("viewbox", `${minLon},${maxLat},${maxLon},${minLat}`);
    }

    const response = await fetch(`${NOMINATIM_BASE}?${params}`, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  } catch {
    return null;
  }
}

/** Check if a point is within reasonable distance of existing points */
function isReasonableLocation(
  lat: number,
  lon: number,
  existing: { latitude: number; longitude: number }[]
): boolean {
  if (existing.length < 2) return true;

  const avgLat =
    existing.reduce((s, p) => s + p.latitude, 0) / existing.length;
  const avgLon =
    existing.reduce((s, p) => s + p.longitude, 0) / existing.length;
  const dist = haversineKm(avgLat, avgLon, lat, lon);
  return dist <= MAX_REASONABLE_DISTANCE_KM;
}

/** Compute bounding box from points with padding (degrees) */
function computeViewbox(
  points: { latitude: number; longitude: number }[],
  paddingDegrees: number
): { minLon: number; minLat: number; maxLon: number; maxLat: number } {
  const lats = points.map((p) => p.latitude);
  const lons = points.map((p) => p.longitude);
  return {
    minLon: Math.min(...lons) - paddingDegrees,
    minLat: Math.min(...lats) - paddingDegrees,
    maxLon: Math.max(...lons) + paddingDegrees,
    maxLat: Math.max(...lats) + paddingDegrees,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function geocodeStops(
  stops: ParsedStop[]
): Promise<GeocodedStop[]> {
  const results: GeocodedStop[] = [];

  for (let i = 0; i < stops.length; i++) {
    if (i > 0) {
      await delay(RATE_LIMIT_MS);
    }

    const stop = stops[i];
    const viewbox =
      results.length >= 1
        ? computeViewbox(
            results.map((r) => ({ latitude: r.latitude, longitude: r.longitude })),
            VIEWBOX_PADDING
          )
        : undefined;

    let geo = await geocodeLocation(stop.name, { viewbox });

    if (!geo && results.length >= 1) {
      geo = await geocodeLocation(stop.name);
    }

    if (geo && isReasonableLocation(geo.latitude, geo.longitude, results)) {
      results.push({
        ...stop,
        latitude: geo.latitude,
        longitude: geo.longitude,
      });
    }
  }

  return results;
}
