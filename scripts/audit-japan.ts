#!/usr/bin/env npx tsx
/**
 * Phase 5: Data quality audit for Japan November 2026 itinerary
 * Runs the full pipeline against real APIs and reports metrics.
 *
 * Usage: npm run audit:japan
 * Requires: Network access for Nominatim, Wikipedia, Overpass APIs
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { parseItineraryText } from "../src/services/itinerary-parser";
import { geocodeStops } from "../src/services/geocoder";
import { enrichStop } from "../src/services/wikipedia";
import { queryNearbyPOIs } from "../src/services/overpass";
import { rankSuggestions } from "../src/services/suggestion-engine";
import {
  JAPAN_ITINERARY_TEXT,
  JAPAN_ITINERARY_TITLE,
} from "../src/fixtures/japan-itinerary";
import type { EnrichedStop } from "../src/types/enrichment";

const PRD_ENRICHMENT_TARGET = 85;
const PRD_SUGGESTIONS_PER_STOP = 5;

async function runAudit(): Promise<void> {
  console.log("\n=== Tourister Japan Data Quality Audit ===\n");
  console.log("Running pipeline: parse → geocode → enrich → suggestions\n");

  const start = Date.now();

  // 1. Parse
  const parsed = parseItineraryText(JAPAN_ITINERARY_TEXT, JAPAN_ITINERARY_TITLE);
  console.log(`✓ Parsed: ${parsed.stops.length} stops`);
  parsed.stops.forEach((s, i) =>
    console.log(`  ${i + 1}. ${s.name}${s.dateStart ? ` (${s.dateStart})` : ""}`)
  );

  // 2. Geocode
  const geocoded = await geocodeStops(parsed.stops);
  const geocodeRate =
    geocoded.length > 0
      ? Math.round((geocoded.length / parsed.stops.length) * 100)
      : 0;
  console.log(`\n✓ Geocoded: ${geocoded.length}/${parsed.stops.length} (${geocodeRate}%)`);

  if (geocoded.length === 0) {
    console.error("\n✗ Geocoding failed — cannot continue audit");
    process.exit(1);
  }

  // 3. Enrich
  const enriched: EnrichedStop[] = [];
  for (let i = 0; i < geocoded.length; i++) {
    const stop = geocoded[i];
    const result = await enrichStop(stop.name);
    enriched.push({
      ...stop,
      ...(result?.nameLocal && { nameLocal: result.nameLocal }),
      enrichment: result
        ? {
            wikipediaSummary: result.wikipediaSummary,
            wikipediaUrl: result.wikipediaUrl,
            imageUrl: result.imageUrl,
            imageAttribution: result.imageAttribution,
          }
        : undefined,
    });
    if (i > 0 && i % 2 === 0) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  const withImageAndSummary = enriched.filter(
    (s) => s.enrichment?.wikipediaSummary && s.enrichment?.imageUrl
  );
  const enrichmentRate =
    enriched.length > 0
      ? Math.round((withImageAndSummary.length / enriched.length) * 100)
  : 0;

  console.log(
    `\n✓ Enriched: ${withImageAndSummary.length}/${enriched.length} with image+summary (${enrichmentRate}%)`
  );
  console.log(
    `  Target: ≥${PRD_ENRICHMENT_TARGET}% — ${enrichmentRate >= PRD_ENRICHMENT_TARGET ? "PASS" : "FAIL"}`
  );

  // 4. Suggestions (sample a few stops to avoid rate limits)
  const sampleStops = enriched.slice(0, 4);
  let totalSuggestions = 0;
  for (const stop of sampleStops) {
    const pois = await queryNearbyPOIs(
      stop.latitude,
      stop.longitude,
      1000
    );
    const month = stop.dateStart
      ? parseInt(stop.dateStart.split("-")[1], 10)
      : 11;
    const ranked = rankSuggestions(pois, 1000, month, 10);
    totalSuggestions += ranked.length;
    await new Promise((r) => setTimeout(r, 500));
  }
  const avgSuggestions =
    sampleStops.length > 0
      ? Math.round((totalSuggestions / sampleStops.length) * 10) / 10
      : 0;

  console.log(
    `\n✓ Suggestions: avg ${avgSuggestions} per stop (sampled ${sampleStops.length} stops)`
  );
  console.log(
    `  Target: ≥${PRD_SUGGESTIONS_PER_STOP} — ${avgSuggestions >= PRD_SUGGESTIONS_PER_STOP ? "PASS" : "FAIL"}`
  );

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n--- Audit complete (${elapsed}s) ---\n`);
}

runAudit().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
