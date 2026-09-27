"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TripEditor } from "@/components/trip-editor";
import { TripPasswordGate } from "@/components/trip-password-gate";
import type { Trip, TripDay } from "@/types/trip";
import { stopsToDays } from "@/types/trip";
import {
  storeTripPassword,
  tripPasswordHeaders,
} from "@/lib/trip-auth-client";
import {
  createDebouncedSaver,
  type SaveStatus,
} from "@/lib/auto-save";

type TripDraft = {
  title: string;
  days: TripDay[];
  password?: string;
};

export default function EditTripPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [locked, setLocked] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const draftRef = useRef<TripDraft | null>(null);
  const saverRef = useRef<ReturnType<typeof createDebouncedSaver> | null>(null);

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  const persistDraft = useCallback(
    async (updated: TripDraft, { redirect }: { redirect: boolean }) => {
      if (!token) return;
      const body: Record<string, unknown> = {
        title: updated.title,
        days: updated.days.map((d) => ({
          dateStart: d.dateStart,
          dateEnd: d.dateEnd,
          name: d.name,
          sortOrder: d.sortOrder,
          items: d.items.map((item) => ({
            name: item.name,
            nameLocal: item.nameLocal,
            latitude: item.latitude,
            longitude: item.longitude,
            notes: item.notes,
            startTime: item.startTime,
            endTime: item.endTime,
            enrichment: item.enrichment,
          })),
        })),
      };
      if (updated.password?.trim()) {
        body.password = updated.password.trim();
      }

      const res = await fetch(`/api/trips/${token}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...tripPasswordHeaders(token),
        },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        setLocked(true);
        throw new Error("Password required");
      }
      if (!res.ok) throw new Error("Save failed");
      if (updated.password?.trim()) {
        storeTripPassword(token, updated.password.trim());
      }
      if (redirect) {
        router.push(`/share/${token}`);
      }
    },
    [token, router]
  );

  useEffect(() => {
    if (!token) return;
    saverRef.current = createDebouncedSaver(
      async () => {
        const draft = draftRef.current;
        if (!draft) return;
        await persistDraft(draft, { redirect: false });
      },
      800,
      setSaveStatus
    );
    const flush = () => {
      void saverRef.current?.flush();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      flush();
      saverRef.current?.cancel();
      saverRef.current = null;
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [token, persistDraft]);

  const loadTrip = useCallback(
    async (password?: string) => {
      if (!token) return;
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
          setTrip(null);
          if (isUnlockAttempt) {
            setPasswordError("Incorrect password");
          }
          return;
        }

        if (!res.ok) throw new Error("Trip not found");

        const data = await res.json();
        let days: TripDay[] = data.days ?? [];
        if (days.length === 0 && data.stops?.length > 0) {
          days = stopsToDays(data.stops);
        }
        setTrip({
          id: data.id,
          title: data.title,
          shareToken: data.shareToken,
          days,
          stops: data.stops ?? [],
        });
        setLocked(false);
        setPasswordError(null);
        if (password) {
          storeTripPassword(token, password);
        }
      } catch {
        setError("Trip not found");
      } finally {
        setLoading(false);
        setCheckingPassword(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!token) return;
    void loadTrip();
  }, [token, loadTrip]);

  const handleChange = useCallback((updated: TripDraft) => {
    draftRef.current = updated;
    saverRef.current?.schedule();
  }, []);

  const handleSave = useCallback(
    async (updated: TripDraft) => {
      if (!token) return;
      setSaving(true);
      draftRef.current = updated;
      try {
        await saverRef.current?.flush();
        await persistDraft(updated, { redirect: true });
      } catch {
        setError("Failed to save");
      } finally {
        setSaving(false);
      }
    },
    [token, persistDraft]
  );

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

  if (error || !trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-foreground/60">{error ?? "Trip not found"}</p>
        <Link href="/trips" className="text-blue-600 hover:underline">
          ← Back to My Trips
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/trips"
            className="text-sm text-foreground/60 hover:text-foreground"
          >
            ← Trips
          </Link>
          <Link
            href={`/share/${token}`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View map
          </Link>
        </div>
        <TripEditor
          trip={trip}
          onSave={handleSave}
          onChange={handleChange}
          isSaving={saving}
          saveStatus={saveStatus}
        />
      </div>
    </div>
  );
}
