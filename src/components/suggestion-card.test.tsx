import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SuggestionCard } from "./suggestion-card";
import type { ActivitySuggestion } from "@/types/suggestions";

const suggestion: ActivitySuggestion = {
  id: "osm-1001",
  name: "Nezameya",
  nameLocal: "祢ざめ家",
  category: "food_and_drink",
  description: "Traditional Inari sushi restaurant near Fushimi Inari.",
  latitude: 34.9672,
  longitude: 135.7728,
  distanceMetres: 150,
  relevanceScore: 7.5,
  seasonalTags: ["koyo"],
  dismissed: false,
};

describe("SuggestionCard", () => {
  it("renders the suggestion name and Japanese name", () => {
    render(
      <SuggestionCard
        suggestion={suggestion}
        onAdd={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText("Nezameya")).toBeInTheDocument();
    expect(screen.getByText("祢ざめ家")).toBeInTheDocument();
  });

  it("renders the category label and distance", () => {
    render(
      <SuggestionCard
        suggestion={suggestion}
        onAdd={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText("Food & Drink")).toBeInTheDocument();
    expect(screen.getByText("150m away")).toBeInTheDocument();
  });

  it("renders seasonal tags with human-readable labels", () => {
    render(
      <SuggestionCard
        suggestion={suggestion}
        onAdd={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText("Autumn foliage")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(
      <SuggestionCard
        suggestion={suggestion}
        onAdd={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Traditional Inari sushi restaurant/)
    ).toBeInTheDocument();
  });

  it("calls onAdd when add button is clicked", () => {
    const onAdd = vi.fn();
    render(
      <SuggestionCard
        suggestion={suggestion}
        onAdd={onAdd}
        onDismiss={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("+ Add to trip"));
    expect(onAdd).toHaveBeenCalled();
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(
      <SuggestionCard
        suggestion={suggestion}
        onAdd={vi.fn()}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByText("Dismiss"));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("renders nothing when dismissed", () => {
    const { container } = render(
      <SuggestionCard
        suggestion={{ ...suggestion, dismissed: true }}
        onAdd={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(container.innerHTML).toBe("");
  });
});
