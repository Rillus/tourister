"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TripMap } from "@/components/trip-map";
import { TripPasswordGate } from "@/components/trip-password-gate";
import { addSavedTripToken } from "@/lib/saved-trips";
import {
  storeTripPassword,
  tripPasswordHeaders,
} from "@/lib/trip-auth-client";
import type { EnrichedStop } from "@/types/enrichment";
import type { TripViewMode } from "@/components/trip-view-toggle";

function ShareTripView({ token }: { token: string }) {
  const searchParams = useSearchParams();
  const initialView: TripViewMode =
    searchParams.get("view") === "plotter" ? "plotter" : "map";

  const [title, setTitle] = useState<string>("");
  const [stops, setStops] = useState<EnrichedStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTrip = useCallback(
    async (password?: string) => {
      const isUnlockAttempt = password !== undefined;
      if (isUnlockAttempt) {
        setCheckingPassword(true);
        setPasswordError(null);
      } else {
        setLoading(true);
      }

      try {
        const res = await fetch(`/api/share/${token}`, {
          headers: tripPasswordHeaders(token, password),
        });

        if (res.status === 401) {
          setLocked(true);
          setStops([]);
          if (isUnlockAttempt) {
            setPasswordError("Incorrect password");
          }
          return;
        }

        if (!res.ok) throw new Error("Itinerary not found");

        const data = await res.json();
        setTitle(data.title);
        setStops(data.stops);
        setLocked(false);
        setPasswordError(null);
        addSavedTripToken(token);
        if (password) {
          storeTripPassword(token, password);
        }
      } catch {
        setError("Itinerary not found");
      } finally {
        setLoading(false);
        setCheckingPassword(false);
      }
    },
    [token]
  );

  useEffect(() => {
    void loadTrip();
  }, [loadTrip]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/60 animate-pulse">Loading…</p>
      </div>
    );
  }

  if (locked) {
    return (
      <TripPasswordGate
        onSubmit={(password) => void loadTrip(password)}
        isChecking={checkingPassword}
        error={passwordError}
      />
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
        shareToken={token}
        title={title}
        readOnly
        initialView={initialView}
      />
    </div>
  );
}

export default function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/60 animate-pulse">Loading…</p>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-foreground/60 animate-pulse">Loading…</p>
        </div>
      }
    >
      <ShareTripView token={token} />
    </Suspense>
  );
}
