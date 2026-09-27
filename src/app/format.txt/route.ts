import { itineraryFormatPlainText } from "@/lib/itinerary-format";

export function GET() {
  return new Response(itineraryFormatPlainText() + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
