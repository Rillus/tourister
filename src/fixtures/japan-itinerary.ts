/**
 * Japan November 2026 sample itinerary — PRD Section 10.1
 * Used for Phase 5: Japan Test (E2E and data quality audit)
 */
export const JAPAN_ITINERARY_TEXT = `Day 1-3, 1-3 Nov 2026: Tokyo (Explore Shibuya, Harajuku, Akihabara)
Day 4, 4 Nov 2026: Nikko (Toshogu Shrine, autumn leaves)
Day 5-6, 5-6 Nov 2026: Hakone (Onsen, Open-Air Museum, Lake Ashi)
Day 7-9, 7-9 Nov 2026: Kyoto (Temples, Arashiyama, Fushimi Inari)
Day 10, 10 Nov 2026: Nara (Todai-ji, deer park)
Day 11-12, 11-12 Nov 2026: Osaka (Dotonbori, street food, Osaka Castle)
Day 13, 13 Nov 2026: Hiroshima (Peace Memorial, Itsukushima Shrine)
Day 14, 14 Nov 2026: Tokyo (Departure)`;

export const JAPAN_ITINERARY_TITLE = "Japan November 2026";

/** Expected stop count and key locations from PRD (for assertions) */
export const EXPECTED_JAPAN_STOP_COUNT = 8;

export const EXPECTED_JAPAN_LOCATIONS = [
  "Tokyo",
  "Nikko",
  "Hakone",
  "Kyoto",
  "Nara",
  "Osaka",
  "Hiroshima",
  "Tokyo",
] as const;
