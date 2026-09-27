"use client";

import { useState } from "react";

interface TripPasswordGateProps {
  onSubmit: (password: string) => void;
  isChecking: boolean;
  error: string | null;
}

export function TripPasswordGate({
  onSubmit,
  isChecking,
  error,
}: TripPasswordGateProps) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    onSubmit(password.trim());
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          This trip is locked
        </h1>
        <p className="mt-2 text-sm text-foreground/55">
          Enter the trip password to view the itinerary.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label
            htmlFor="trip-password"
            className="block text-sm font-medium text-foreground/80 mb-1.5"
          >
            Trip password
          </label>
          <input
            id="trip-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-foreground/15 bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            autoFocus
          />
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!password.trim() || isChecking}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
        >
          {isChecking ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
