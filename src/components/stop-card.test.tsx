import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StopCard } from "./stop-card";
import type { EnrichedStop } from "@/types/enrichment";

const enrichedStop: EnrichedStop = {
  name: "Fushimi Inari",
  nameLocal: "伏見稲荷大社",
  latitude: 34.9671,
  longitude: 135.7727,
  dateStart: "2026-11-07",
  notes: "Thousands of torii gates",
  enrichment: {
    wikipediaSummary:
      "Fushimi Inari-taisha is the head shrine of the kami Inari.",
    wikipediaUrl: "https://en.wikipedia.org/wiki/Fushimi_Inari-taisha",
    imageUrl: "https://upload.wikimedia.org/fushimi.jpg",
    imageAttribution: "Wikimedia Commons (CC)",
  },
};

const bareStop: EnrichedStop = {
  name: "Some Place",
  latitude: 35.0,
  longitude: 135.0,
  notes: "A nice spot",
};

describe("StopCard", () => {
  it("renders the stop name and Japanese name", () => {
    render(
      <StopCard
        stop={enrichedStop}
        index={0}
        isSelected={false}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText("Fushimi Inari")).toBeInTheDocument();
    expect(screen.getByText("伏見稲荷大社")).toBeInTheDocument();
  });

  it("renders the Wikipedia summary", () => {
    render(
      <StopCard
        stop={enrichedStop}
        index={0}
        isSelected={false}
        onSelect={vi.fn()}
      />
    );

    expect(
      screen.getByText(/head shrine of the kami Inari/)
    ).toBeInTheDocument();
  });

  it("renders a Wikipedia link", () => {
    render(
      <StopCard
        stop={enrichedStop}
        index={0}
        isSelected={false}
        onSelect={vi.fn()}
      />
    );

    const link = screen.getByText("Read more on Wikipedia →");
    expect(link).toHaveAttribute(
      "href",
      "https://en.wikipedia.org/wiki/Fushimi_Inari-taisha"
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders the stop image", () => {
    render(
      <StopCard
        stop={enrichedStop}
        index={0}
        isSelected={false}
        onSelect={vi.fn()}
      />
    );

    const img = screen.getByAltText("Fushimi Inari");
    expect(img).toHaveAttribute(
      "src",
      "https://upload.wikimedia.org/fushimi.jpg"
    );
  });

  it("renders the numbered badge", () => {
    render(
      <StopCard
        stop={enrichedStop}
        index={4}
        isSelected={false}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders dates", () => {
    render(
      <StopCard
        stop={enrichedStop}
        index={0}
        isSelected={false}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText("2026-11-07")).toBeInTheDocument();
  });

  it("calls onSelect when clicked", () => {
    const onSelect = vi.fn();
    render(
      <StopCard
        stop={enrichedStop}
        index={0}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText("Fushimi Inari"));
    expect(onSelect).toHaveBeenCalled();
  });

  it("shows notes when no enrichment is available", () => {
    render(
      <StopCard
        stop={bareStop}
        index={0}
        isSelected={false}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText("A nice spot")).toBeInTheDocument();
    expect(screen.queryByText("Read more on Wikipedia →")).not.toBeInTheDocument();
  });

  it("does not render image section for unenriched stops", () => {
    render(
      <StopCard
        stop={bareStop}
        index={0}
        isSelected={false}
        onSelect={vi.fn()}
      />
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows editable notes textarea when selected and editable", () => {
    const onNotesChange = vi.fn();
    render(
      <StopCard
        stop={bareStop}
        index={0}
        isSelected
        onSelect={vi.fn()}
        editable
        onNotesChange={onNotesChange}
      />
    );

    const textarea = screen.getByPlaceholderText("Add notes…");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("A nice spot");

    fireEvent.change(textarea, { target: { value: "Updated notes" } });
    expect(onNotesChange).toHaveBeenCalledWith("Updated notes");
  });

  it("shows editable title when selected and editable", () => {
    const onTitleChange = vi.fn();
    render(
      <StopCard
        stop={bareStop}
        index={0}
        isSelected
        onSelect={vi.fn()}
        editable
        onTitleChange={onTitleChange}
      />
    );

    const input = screen.getByLabelText("Stop title");
    expect(input).toHaveValue("Some Place");
    fireEvent.change(input, { target: { value: "Kyoto Station" } });
    expect(onTitleChange).toHaveBeenCalledWith("Kyoto Station");
  });

  it("saves title on blur", () => {
    const onTitleBlur = vi.fn();
    render(
      <StopCard
        stop={bareStop}
        index={0}
        isSelected
        onSelect={vi.fn()}
        editable
        onTitleChange={vi.fn()}
        onTitleBlur={onTitleBlur}
      />
    );

    fireEvent.blur(screen.getByLabelText("Stop title"));
    expect(onTitleBlur).toHaveBeenCalled();
  });

  it("offers Get details when enrichment is missing", () => {
    const onFetchEnrichment = vi.fn();
    render(
      <StopCard
        stop={bareStop}
        index={0}
        isSelected
        onSelect={vi.fn()}
        editable
        onFetchEnrichment={onFetchEnrichment}
      />
    );

    fireEvent.click(screen.getByText("Get details"));
    expect(onFetchEnrichment).toHaveBeenCalled();
  });

  it("offers Refresh details when enrichment already exists", () => {
    const onFetchEnrichment = vi.fn();
    render(
      <StopCard
        stop={enrichedStop}
        index={0}
        isSelected
        onSelect={vi.fn()}
        editable
        onFetchEnrichment={onFetchEnrichment}
      />
    );

    fireEvent.click(screen.getByText("Refresh details"));
    expect(onFetchEnrichment).toHaveBeenCalled();
  });

  it("shows no location message and Drop pin when coordinates are missing", () => {
    const onDropPin = vi.fn();
    render(
      <StopCard
        stop={{ name: "Mystery place", latitude: 0, longitude: 0 }}
        index={0}
        isSelected
        onSelect={vi.fn()}
        editable
        onDropPin={onDropPin}
      />
    );

    expect(screen.getByText(/No location found/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Drop pin"));
    expect(onDropPin).toHaveBeenCalled();
  });

  it("does not show Drop pin when location is valid", () => {
    render(
      <StopCard
        stop={bareStop}
        index={0}
        isSelected
        onSelect={vi.fn()}
        editable
        onDropPin={vi.fn()}
      />
    );
    expect(screen.queryByText(/No location found/i)).not.toBeInTheDocument();
  });
});
