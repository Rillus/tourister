import type { OverpassPOI } from "./overpass";
import type { ActivitySuggestion, ActivityCategory } from "@/types/suggestions";

const CATEGORY_WEIGHTS: Record<ActivityCategory, number> = {
  culture_and_history: 1.5,
  food_and_drink: 1.3,
  nature_and_parks: 1.2,
  experiences: 1.0,
  shopping: 0.9,
  nightlife: 0.8,
};

const AUTUMN_KEYWORDS = [
  "koyo",
  "momiji",
  "autumn",
  "foliage",
  "maple",
  "fall",
  "garden",
  "park",
  "eikando",
  "tofukuji",
];

const KOYO_SPOTS = new Set([
  "eikando",
  "tofukuji",
  "arashiyama",
  "kiyomizudera",
  "kinkakuji",
  "nanzenji",
  "daigoji",
  "kitano tenmangu",
  "jojakko-ji",
  "shinjuku gyoen",
  "rikugien",
  "meiji jingu gaien",
  "nikko",
  "kenrokuen",
]);

export function detectSeasonalTags(
  name: string,
  tags: Record<string, string>,
  month?: number
): string[] {
  if (!month) return [];

  const result: string[] = [];
  const nameLower = name.toLowerCase();

  if (month >= 10 && month <= 12) {
    const isAutumnRelated =
      AUTUMN_KEYWORDS.some((kw) => nameLower.includes(kw)) ||
      tags.natural === "wood" ||
      tags.natural === "tree" ||
      tags.leisure === "garden" ||
      KOYO_SPOTS.has(nameLower);

    if (isAutumnRelated) result.push("koyo");

    if (
      (tags.amenity === "place_of_worship" || tags.tourism === "attraction") &&
      (tags.religion === "shinto" || nameLower.includes("shrine")) &&
      month === 11
    ) {
      result.push("shichi-go-san");
    }

    if (
      tags.natural === "hot_spring" ||
      nameLower.includes("onsen") ||
      nameLower.includes("hot spring")
    ) {
      result.push("onsen-season");
    }
  }

  if (month === 11) {
    if (nameLower.includes("illumination") || nameLower.includes("light-up")) {
      result.push("autumn-illumination");
    }
  }

  return result;
}

export function scorePOI(
  poi: OverpassPOI,
  radiusMetres: number,
  month?: number
): number {
  // Proximity score: 0–4 points (closer = higher)
  const proximityRatio = 1 - poi.distanceMetres / radiusMetres;
  const proximityScore = Math.max(0, proximityRatio) * 4;

  // Category weight: 0–3 points
  const categoryWeight = CATEGORY_WEIGHTS[poi.category] ?? 1.0;
  const categoryScore = categoryWeight * 2;

  // Seasonal boost: 0–3 points
  const seasonalTags = detectSeasonalTags(poi.name, poi.tags, month);
  const seasonalScore = Math.min(seasonalTags.length * 1.5, 3);

  const total = proximityScore + categoryScore + seasonalScore;
  return Math.min(Math.round(total * 100) / 100, 10);
}

export function rankSuggestions(
  pois: OverpassPOI[],
  radiusMetres: number,
  month?: number,
  limit: number = 15
): ActivitySuggestion[] {
  const scored = pois.map((poi) => ({
    poi,
    score: scorePOI(poi, radiusMetres, month),
    seasonalTags: detectSeasonalTags(poi.name, poi.tags, month),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ poi, score, seasonalTags }) => ({
    id: `osm-${poi.osmId}`,
    name: poi.name,
    nameLocal: poi.nameLocal,
    category: poi.category,
    latitude: poi.latitude,
    longitude: poi.longitude,
    distanceMetres: poi.distanceMetres,
    relevanceScore: score,
    seasonalTags,
    dismissed: false,
  }));
}
