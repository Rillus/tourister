"use client";

import { useState } from "react";

interface ItineraryInputProps {
  onParse: (text: string, title: string) => void;
  isLoading: boolean;
}

const PLACEHOLDER = `Day 1-3, 1-3 Nov: Tokyo (Explore Shibuya, Harajuku, Akihabara)
Day 4, 4 Nov: Nikko (Toshogu Shrine, autumn leaves)
Day 5-6, 5-6 Nov: Hakone (Onsen, Open-Air Museum, Lake Ashi)
Day 7-9, 7-9 Nov: Kyoto (Temples, Arashiyama, Fushimi Inari)
Day 10, 10 Nov: Nara (Todai-ji, deer park)
Day 11-12, 11-12 Nov: Osaka (Dotonbori, street food, Osaka Castle)
Day 13, 13 Nov: Hiroshima (Peace Memorial, Itsukushima Shrine)
Day 14, 14 Nov: Tokyo (Departure)`;

export function ItineraryInput({ onParse, isLoading }: ItineraryInputProps) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onParse(text, title || "My Trip");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="trip-title"
          className="block text-sm font-medium text-foreground/80 mb-1.5"
        >
          Trip title
        </label>
        <input
          id="trip-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Japan November 2026"
          className="w-full rounded-lg border border-foreground/15 bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder:text-foreground/30 transition"
        />
      </div>
      <div>
        <label
          htmlFor="itinerary-text"
          className="block text-sm font-medium text-foreground/80 mb-1.5"
        >
          Paste your itinerary
        </label>
        <textarea
          id="itinerary-text"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          className="w-full rounded-lg border border-foreground/15 bg-background px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder:text-foreground/20 transition resize-y"
        />
        <p className="mt-1.5 text-xs text-foreground/40">
          One stop per line. Dates, notes in parentheses, and &ldquo;Day
          X&rdquo; prefixes are all supported.
        </p>
      </div>
      <button
        type="submit"
        disabled={!text.trim() || isLoading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
      >
        {isLoading ? "Parsing…" : "Parse itinerary"}
      </button>
    </form>
  );
}
