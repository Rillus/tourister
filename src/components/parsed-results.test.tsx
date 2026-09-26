import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ParsedResults } from "./parsed-results";
import type { ParsedItinerary } from "@/types/itinerary";

const sampleItinerary: ParsedItinerary = {
  title: "Japan Trip",
  stops: [
    { name: "Tokyo", dateStart: "2026-11-01", dateEnd: "2026-11-03", notes: "Explore Shibuya" },
    { name: "Kyoto", dateStart: "2026-11-07" },
    { name: "Osaka" },
  ],
};

describe("ParsedResults", () => {
  it("renders all stops with numbered badges", () => {
    render(
      <ParsedResults
        itinerary={sampleItinerary}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
        onUpdateStop={vi.fn()}
        onRemoveStop={vi.fn()}
        isLoading={false}
      />
    );

    expect(screen.getByText("Japan Trip")).toBeInTheDocument();
    expect(screen.getByText("3 stops")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Tokyo")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Kyoto")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Osaka")).toBeInTheDocument();
  });

  it("displays dates and notes", () => {
    render(
      <ParsedResults
        itinerary={sampleItinerary}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
        onUpdateStop={vi.fn()}
        onRemoveStop={vi.fn()}
        isLoading={false}
      />
    );

    expect(screen.getByText("2026-11-01 → 2026-11-03")).toBeInTheDocument();
    expect(screen.getByText("Explore Shibuya")).toBeInTheDocument();
  });

  it("calls onBack when back button is clicked", () => {
    const onBack = vi.fn();
    render(
      <ParsedResults
        itinerary={sampleItinerary}
        onConfirm={vi.fn()}
        onBack={onBack}
        onUpdateStop={vi.fn()}
        onRemoveStop={vi.fn()}
        isLoading={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
  });

  it("calls onConfirm when plot button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ParsedResults
        itinerary={sampleItinerary}
        onConfirm={onConfirm}
        onBack={vi.fn()}
        onUpdateStop={vi.fn()}
        onRemoveStop={vi.fn()}
        isLoading={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Plot on map" }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("calls onRemoveStop when remove button is clicked", () => {
    const onRemoveStop = vi.fn();
    render(
      <ParsedResults
        itinerary={sampleItinerary}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
        onUpdateStop={vi.fn()}
        onRemoveStop={onRemoveStop}
        isLoading={false}
      />
    );

    const removeButtons = screen.getAllByLabelText(/Remove/);
    fireEvent.click(removeButtons[0]);
    expect(onRemoveStop).toHaveBeenCalledWith(0);
  });

  it("shows geocoding loading state", () => {
    render(
      <ParsedResults
        itinerary={sampleItinerary}
        onConfirm={vi.fn()}
        onBack={vi.fn()}
        onUpdateStop={vi.fn()}
        onRemoveStop={vi.fn()}
        isLoading={true}
      />
    );

    expect(screen.getByRole("button", { name: "Building map…" })).toBeDisabled();
  });
});
