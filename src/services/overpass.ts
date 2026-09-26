import type { ActivityCategory } from "@/types/suggestions";

const OVERPASS_API = "https://overpass-api.de/api/interpreter";

export interface OverpassPOI {
  osmId: number;
  name: string;
  nameLocal?: string;
  latitude: number;
  longitude: number;
  category: ActivityCategory;
  distanceMetres: number;
  tags: Record<string, string>;
}

function buildQuery(lat: number, lon: number, radiusMetres: number): string {
  return `
[out:json][timeout:15];
(
  node["tourism"~"attraction|museum|gallery|viewpoint|artwork|information"](around:${radiusMetres},${lat},${lon});
  node["amenity"~"restaurant|cafe|bar|pub|fast_food|nightclub|theatre|cinema|place_of_worship"](around:${radiusMetres},${lat},${lon});
  node["historic"](around:${radiusMetres},${lat},${lon});
  node["leisure"~"park|garden|nature_reserve|playground"](around:${radiusMetres},${lat},${lon});
  node["shop"~"gift|mall|department_store|supermarket|clothes|books|art"](around:${radiusMetres},${lat},${lon});
  node["natural"~"peak|beach|hot_spring|spring"](around:${radiusMetres},${lat},${lon});
);
out body;
`.trim();
}

const FOOD_AMENITIES = new Set([
  "restaurant",
  "cafe",
  "fast_food",
  "food_court",
  "ice_cream",
]);

const NIGHTLIFE_AMENITIES = new Set([
  "bar",
  "pub",
  "nightclub",
  "biergarten",
]);

const CULTURE_AMENITIES = new Set([
  "place_of_worship",
  "theatre",
  "cinema",
  "library",
  "community_centre",
]);

const CULTURE_TOURISM = new Set([
  "attraction",
  "museum",
  "gallery",
  "artwork",
  "information",
]);

const NATURE_LEISURE = new Set([
  "park",
  "garden",
  "nature_reserve",
  "playground",
]);

const SHOP_TYPES = new Set([
  "gift",
  "mall",
  "department_store",
  "supermarket",
  "clothes",
  "books",
  "art",
  "convenience",
]);

function categorise(tags: Record<string, string>): ActivityCategory {
  const amenity = tags.amenity;
  const tourism = tags.tourism;
  const leisure = tags.leisure;
  const shop = tags.shop;

  if (amenity && FOOD_AMENITIES.has(amenity)) return "food_and_drink";
  if (amenity && NIGHTLIFE_AMENITIES.has(amenity)) return "nightlife";
  if (amenity && CULTURE_AMENITIES.has(amenity)) return "culture_and_history";

  if (tags.historic) return "culture_and_history";
  if (tourism && CULTURE_TOURISM.has(tourism)) return "culture_and_history";

  if (leisure && NATURE_LEISURE.has(leisure)) return "nature_and_parks";
  if (tags.natural) return "nature_and_parks";

  if (shop && SHOP_TYPES.has(shop)) return "shopping";

  return "experiences";
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export async function queryNearbyPOIs(
  lat: number,
  lon: number,
  radiusMetres: number = 1000
): Promise<OverpassPOI[]> {
  try {
    const query = buildQuery(lat, lon, radiusMetres);

    const response = await fetch(OVERPASS_API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) return [];

    const data = await response.json();
    const elements = data.elements || [];

    return elements
      .filter(
        (el: Record<string, unknown>) =>
          el.tags &&
          (el.tags as Record<string, string>).name
      )
      .map((el: Record<string, unknown>) => {
        const tags = el.tags as Record<string, string>;
        return {
          osmId: el.id as number,
          name: tags.name,
          nameLocal: tags["name:ja"] || tags["name:en"] || undefined,
          latitude: el.lat as number,
          longitude: el.lon as number,
          category: categorise(tags),
          distanceMetres: haversineDistance(
            lat,
            lon,
            el.lat as number,
            el.lon as number
          ),
          tags,
        };
      });
  } catch {
    return [];
  }
}
