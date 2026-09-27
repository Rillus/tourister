"use client";

import { useState } from "react";
import Link from "next/link";
import { ItineraryInput } from "@/components/itinerary-input";
import { ParsedResults } from "@/components/parsed-results";
import { TripMap } from "@/components/trip-map";
import type { ParsedItinerary, ParsedStop } from "@/types/itinerary";
import type { EnrichedStop } from "@/types/enrichment";
import { addSavedTripToken } from "@/lib/saved-trips";
import { storeTripPassword } from "@/lib/trip-auth-client";

type Step = "input" | "confirm" | "map";

export default function HomePage() {
  const [step, setStep] = useState<Step>("input");
  const [parsedItinerary, setParsedItinerary] =
    useState<ParsedItinerary | null>(null);
  const [tripPassword, setTripPassword] = useState<string>("");
  const [enrichedStops, setEnrichedStops] = useState<EnrichedStop[]>([]);
  const [enrichmentRate, setEnrichmentRate] = useState<number>(0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleParse = async (
    text: string,
    title: string,
    password: string
  ) => {
    setIsLoading(true);
    setError(null);
    setTripPassword(password);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, title }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to parse itinerary");
      }

      const data = await res.json();
      setParsedItinerary(data);
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsedItinerary) return;
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Geocode
      setLoadingMessage("Geocoding stops…");
      const geoRes = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stops: parsedItinerary.stops }),
      });

      if (!geoRes.ok) {
        const data = await geoRes.json();
        throw new Error(data.error || "Geocoding failed");
      }

      const geoData = await geoRes.json();

      if (geoData.stops.length === 0) {
        throw new Error("No stops could be geocoded. Please check the names.");
      }

      // Step 2: Enrich
      setLoadingMessage("Fetching Wikipedia data…");
      const enrichRes = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stops: geoData.stops }),
      });

      let enriched: EnrichedStop[];
      if (!enrichRes.ok) {
        enriched = geoData.stops.map((s: EnrichedStop) => ({ ...s }));
        setEnrichedStops(enriched);
        setEnrichmentRate(0);
      } else {
        const enrichData = await enrichRes.json();
        enriched = enrichData.stops;
        setEnrichedStops(enriched);
        setEnrichmentRate(enrichData.enrichmentRate);
      }

      try {
        setLoadingMessage("Saving…");
        const saveRes = await fetch("/api/itineraries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: parsedItinerary.title,
            password: tripPassword,
            stops: enriched.map((s) => ({
              name: s.name,
              nameLocal: s.nameLocal,
              latitude: s.latitude,
              longitude: s.longitude,
              dateStart: s.dateStart,
              dateEnd: s.dateEnd,
              notes: s.notes,
              enrichment: s.enrichment,
            })),
          }),
        });

        if (saveRes.ok) {
          const saved = await saveRes.json();
          addSavedTripToken(saved.shareToken);
          storeTripPassword(saved.shareToken, tripPassword);
          setShareToken(saved.shareToken);
          const baseUrl =
            typeof window !== "undefined"
              ? window.location.origin
              : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
          setShareUrl(`${baseUrl}/share/${saved.shareToken}`);
        }
      } catch {
        // Save failure is non-fatal — map still works
      }

      setStep("map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleUpdateStop = (index: number, stop: ParsedStop) => {
    if (!parsedItinerary) return;
    const updated = [...parsedItinerary.stops];
    updated[index] = stop;
    setParsedItinerary({ ...parsedItinerary, stops: updated });
  };

  const handleRemoveStop = (index: number) => {
    if (!parsedItinerary) return;
    const updated = parsedItinerary.stops.filter((_, i) => i !== index);
    setParsedItinerary({ ...parsedItinerary, stops: updated });
  };

  if (step === "map" && enrichedStops.length > 0) {
    return (
      <div className="h-screen flex flex-col">
        <TripMap
          stops={enrichedStops}
          onBack={() => setStep("confirm")}
          enrichmentRate={enrichmentRate}
          shareUrl={shareUrl}
          shareToken={shareToken}
          title={parsedItinerary?.title}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center p-4 sm:p-6 md:p-12">
      <div className="w-full max-w-lg min-w-0">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Tourister</h1>
          <p className="text-sm text-foreground/50 mt-1">
            Transform your itinerary into an interactive map
          </p>
          <Link
            href="/trips"
            className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-700"
          >
            My saved trips →
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(["input", "confirm", "map"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full transition ${
                  step === s
                    ? "bg-blue-600"
                    : i < ["input", "confirm", "map"].indexOf(step)
                      ? "bg-blue-400"
                      : "bg-foreground/15"
                }`}
              />
              {i < 2 && <div className="w-8 h-px bg-foreground/15" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {step === "input" && (
          <ItineraryInput onParse={handleParse} isLoading={isLoading} />
        )}

        {step === "confirm" && parsedItinerary && (
          <>
            <ParsedResults
              itinerary={parsedItinerary}
              onConfirm={handleConfirm}
              onBack={() => setStep("input")}
              onUpdateStop={handleUpdateStop}
              onRemoveStop={handleRemoveStop}
              isLoading={isLoading}
            />
            {isLoading && loadingMessage && (
              <p className="mt-4 text-center text-sm text-foreground/50 animate-pulse">
                {loadingMessage}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
