export type ActivityCategory =
  | "food_and_drink"
  | "culture_and_history"
  | "nature_and_parks"
  | "shopping"
  | "nightlife"
  | "experiences";

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  food_and_drink: "Food & Drink",
  culture_and_history: "Culture & History",
  nature_and_parks: "Nature & Parks",
  shopping: "Shopping",
  nightlife: "Nightlife",
  experiences: "Experiences",
};

export const CATEGORY_ICONS: Record<ActivityCategory, string> = {
  food_and_drink: "🍜",
  culture_and_history: "⛩️",
  nature_and_parks: "🌿",
  shopping: "🛍️",
  nightlife: "🌙",
  experiences: "✨",
};

/** Human-readable labels for seasonal relevance tags (Japan November context) */
export const SEASONAL_TAG_LABELS: Record<string, string> = {
  koyo: "Autumn foliage",
  "shichi-go-san": "Shichi-Go-San (15 Nov)",
  "onsen-season": "Onsen season",
  "autumn-illumination": "Autumn illumination",
};

export function getSeasonalTagLabel(tag: string): string {
  return SEASONAL_TAG_LABELS[tag] ?? tag;
}

export interface ActivitySuggestion {
  id: string;
  name: string;
  nameLocal?: string;
  category: ActivityCategory;
  description?: string;
  latitude: number;
  longitude: number;
  distanceMetres: number;
  imageUrl?: string;
  relevanceScore: number;
  seasonalTags: string[];
  dismissed: boolean;
}
