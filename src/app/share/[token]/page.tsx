"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TripMap } from "@/components/trip-map";
import { addSavedTripToken } from "@/lib/saved-trips";
import type { EnrichedStop } from "@/types/enrichment";

export default function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [stops, setStops] = useState<EnrichedStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/share/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Itinerary not found");
        return res.json();
      })
      .then((data) => {
        setTitle(data.title);
        setStops(data.stops);
        addSavedTripToken(token);
      })
      .catch(() => setError("Itinerary not found"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/60 animate-pulse">Loading…</p>
      </div>
    );
  }

  if (error || stops.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-foreground/60">
          {error ?? "No stops in this itinerary."}
        </p>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Create your own itinerary →
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <TripMap
        stops={stops}
        onBack={() => (window.location.href = "/")}
        shareToken={token ?? undefined}
        readOnly
      />
    </div>
  );
}
