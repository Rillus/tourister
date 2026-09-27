import type { Metadata } from "next";
import { ItineraryFormatGuide } from "@/components/itinerary-format-guide";

export const metadata: Metadata = {
  title: "Itinerary format",
  description:
    "How to write a Tourister itinerary in plain text — day lines, dates, notes, and times. For humans and agents.",
  alternates: {
    types: {
      "text/plain": "/format.txt",
    },
  },
};

export default function FormatPage() {
  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <ItineraryFormatGuide />
      </div>
    </div>
  );
}
