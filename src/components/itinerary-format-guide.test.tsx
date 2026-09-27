import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ItineraryFormatGuide } from "@/components/itinerary-format-guide";
import { ITINERARY_FORMAT_TITLE } from "@/lib/itinerary-format";

describe("ItineraryFormatGuide", () => {
  it("publishes the format title, rules, example and plain-text link", () => {
    render(<ItineraryFormatGuide />);

    expect(
      screen.getByRole("heading", { name: ITINERARY_FORMAT_TITLE })
    ).toBeInTheDocument();
    expect(screen.getByText("One stop per line")).toBeInTheDocument();
    expect(screen.getByText("Dates")).toBeInTheDocument();
    expect(
      screen.getByText((content) =>
        content.includes("Day 1-3, 1-3 Nov 2026: Tokyo")
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /plain text/i })
    ).toHaveAttribute("href", "/format.txt");
  });
});
