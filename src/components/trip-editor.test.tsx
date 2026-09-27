import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TripEditor } from "./trip-editor";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("./map-picker", () => ({
  MapPicker: ({
    onSelect,
    onCancel,
  }: {
    onSelect: (lat: number, lon: number) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="map-picker">
      <button type="button" onClick={() => onSelect(35.5, 139.7)}>
        Confirm location
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

import type { Trip } from "@/types/trip";

const sampleTrip: Trip = {
  id: "1",
  title: "Japan 2026",
  shareToken: "abc123",
  days: [
    {
      id: "d1",
      dateStart: "2026-11-01",
      dateEnd: "2026-11-01",
      name: "Tokyo",
      sortOrder: 0,
      items: [
        {
          name: "Shibuya",
          latitude: 35.66,
          longitude: 139.7,
          notes: "Explore",
          startTime: "10:00",
        },
      ],
    },
  ],
  stops: [],
};

describe("TripEditor", () => {
  it("renders trip title", () => {
    const onSave = vi.fn();
    render(<TripEditor trip={sampleTrip} onSave={onSave} isSaving={false} />);

    expect(screen.getByDisplayValue("Japan 2026")).toBeInTheDocument();
  });

  it("shows calendar and selected day plotter", () => {
    const onSave = vi.fn();
    render(<TripEditor trip={sampleTrip} onSave={onSave} isSaving={false} />);

    expect(screen.getByLabelText("Trip calendar")).toBeInTheDocument();
    expect(screen.getByText(/1 Nov 2026/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Tokyo")).toBeInTheDocument();
    expect(screen.getByText("Shibuya")).toBeInTheDocument();
  });

  it("calls onSave when Save is clicked", () => {
    const onSave = vi.fn();
    render(<TripEditor trip={sampleTrip} onSave={onSave} isSaving={false} />);

    fireEvent.click(screen.getByText("Save & view map"));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Japan 2026",
        days: expect.any(Array),
      })
    );
    expect(onSave.mock.calls[0][0].days[0].items[0].name).toBe("Shibuya");
  });

  it("creates a day when selecting an empty calendar date", () => {
    const onSave = vi.fn();
    render(<TripEditor trip={sampleTrip} onSave={onSave} isSaving={false} />);

    fireEvent.click(screen.getByLabelText("2026-11-02"));
    expect(screen.getByText(/2 Nov 2026/i)).toBeInTheDocument();
    expect(
      screen.getByText(/No activities — add one to start plotting this day/i)
    ).toBeInTheDocument();
  });

  it("adds an activity via the day plotter", () => {
    const onSave = vi.fn();
    render(<TripEditor trip={sampleTrip} onSave={onSave} isSaving={false} />);

    fireEvent.click(screen.getByText("+ Add activity"));
    fireEvent.change(screen.getByLabelText("Activity name"), {
      target: { value: "Harajuku" },
    });
    fireEvent.change(screen.getByLabelText("Start time"), {
      target: { value: "14:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    fireEvent.click(screen.getByText("Save & view map"));
    const saved = onSave.mock.calls[0][0].days[0].items;
    expect(saved.some((i: { name: string }) => i.name === "Harajuku")).toBe(
      true
    );
  });

  it("disables save button when saving", () => {
    const onSave = vi.fn();
    render(<TripEditor trip={sampleTrip} onSave={onSave} isSaving={true} />);

    expect(screen.getByText("Saving…")).toBeDisabled();
  });

  it("opens map picker when Drop pin is clicked and updates item on confirm", () => {
    const onSave = vi.fn();
    render(<TripEditor trip={sampleTrip} onSave={onSave} isSaving={false} />);

    fireEvent.click(screen.getByLabelText("Move pin for Shibuya"));
    expect(screen.getByTestId("map-picker")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Confirm location"));
    expect(screen.queryByTestId("map-picker")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Save & view map"));
    const savedItems = onSave.mock.calls[0][0].days[0].items;
    expect(savedItems[0]).toMatchObject({ latitude: 35.5, longitude: 139.7 });
  });
});
