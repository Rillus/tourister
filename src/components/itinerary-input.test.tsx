import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ItineraryInput } from "./itinerary-input";

describe("ItineraryInput", () => {
  it("renders the form with title and textarea inputs", () => {
    render(<ItineraryInput onParse={vi.fn()} isLoading={false} />);

    expect(screen.getByLabelText("Trip title")).toBeInTheDocument();
    expect(screen.getByLabelText("Paste your itinerary")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Parse itinerary" })
    ).toBeInTheDocument();
  });

  it("disables the submit button when textarea is empty", () => {
    render(<ItineraryInput onParse={vi.fn()} isLoading={false} />);

    const button = screen.getByRole("button", { name: "Parse itinerary" });
    expect(button).toBeDisabled();
  });

  it("enables the submit button when textarea has content", () => {
    render(<ItineraryInput onParse={vi.fn()} isLoading={false} />);

    fireEvent.change(screen.getByLabelText("Paste your itinerary"), {
      target: { value: "Tokyo\nKyoto" },
    });

    const button = screen.getByRole("button", { name: "Parse itinerary" });
    expect(button).toBeEnabled();
  });

  it("calls onParse with text and title on submit", () => {
    const onParse = vi.fn();
    render(<ItineraryInput onParse={onParse} isLoading={false} />);

    fireEvent.change(screen.getByLabelText("Trip title"), {
      target: { value: "Japan Trip" },
    });
    fireEvent.change(screen.getByLabelText("Paste your itinerary"), {
      target: { value: "Tokyo\nKyoto" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Parse itinerary" }));

    expect(onParse).toHaveBeenCalledWith("Tokyo\nKyoto", "Japan Trip");
  });

  it("defaults title to 'My Trip' when none provided", () => {
    const onParse = vi.fn();
    render(<ItineraryInput onParse={onParse} isLoading={false} />);

    fireEvent.change(screen.getByLabelText("Paste your itinerary"), {
      target: { value: "Tokyo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Parse itinerary" }));

    expect(onParse).toHaveBeenCalledWith("Tokyo", "My Trip");
  });

  it("shows loading state", () => {
    render(<ItineraryInput onParse={vi.fn()} isLoading={true} />);

    expect(screen.getByRole("button", { name: "Parsing…" })).toBeDisabled();
  });
});
