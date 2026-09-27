import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ItineraryInput } from "./itinerary-input";

function fillRequired(
  text = "Tokyo\nKyoto",
  password = "secret",
  title?: string
) {
  if (title !== undefined) {
    fireEvent.change(screen.getByLabelText("Trip title"), {
      target: { value: title },
    });
  }
  fireEvent.change(screen.getByLabelText("Trip password"), {
    target: { value: password },
  });
  fireEvent.change(screen.getByLabelText("Paste your itinerary"), {
    target: { value: text },
  });
}

describe("ItineraryInput", () => {
  it("renders the form with title, password and textarea inputs", () => {
    render(<ItineraryInput onParse={vi.fn()} isLoading={false} />);

    expect(screen.getByLabelText("Trip title")).toBeInTheDocument();
    expect(screen.getByLabelText("Trip password")).toBeInTheDocument();
    expect(screen.getByLabelText("Paste your itinerary")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Parse itinerary" })
    ).toBeInTheDocument();
  });

  it("disables the submit button when textarea is empty", () => {
    render(<ItineraryInput onParse={vi.fn()} isLoading={false} />);

    fireEvent.change(screen.getByLabelText("Trip password"), {
      target: { value: "secret" },
    });

    const button = screen.getByRole("button", { name: "Parse itinerary" });
    expect(button).toBeDisabled();
  });

  it("disables submit when password is too short", () => {
    render(<ItineraryInput onParse={vi.fn()} isLoading={false} />);

    fillRequired("Tokyo", "ab");

    expect(
      screen.getByRole("button", { name: "Parse itinerary" })
    ).toBeDisabled();
  });

  it("enables the submit button when text and password are set", () => {
    render(<ItineraryInput onParse={vi.fn()} isLoading={false} />);

    fillRequired();

    expect(
      screen.getByRole("button", { name: "Parse itinerary" })
    ).toBeEnabled();
  });

  it("calls onParse with text, title and password on submit", () => {
    const onParse = vi.fn();
    render(<ItineraryInput onParse={onParse} isLoading={false} />);

    fillRequired("Tokyo\nKyoto", "hunter2", "Japan Trip");
    fireEvent.click(screen.getByRole("button", { name: "Parse itinerary" }));

    expect(onParse).toHaveBeenCalledWith(
      "Tokyo\nKyoto",
      "Japan Trip",
      "hunter2"
    );
  });

  it("defaults title to 'My Trip' when none provided", () => {
    const onParse = vi.fn();
    render(<ItineraryInput onParse={onParse} isLoading={false} />);

    fillRequired("Tokyo", "secret");
    fireEvent.click(screen.getByRole("button", { name: "Parse itinerary" }));

    expect(onParse).toHaveBeenCalledWith("Tokyo", "My Trip", "secret");
  });

  it("shows loading state", () => {
    render(<ItineraryInput onParse={vi.fn()} isLoading={true} />);

    expect(screen.getByRole("button", { name: "Parsing…" })).toBeDisabled();
  });
});
