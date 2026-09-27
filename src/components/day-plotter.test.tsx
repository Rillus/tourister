import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DayPlotter } from "./day-plotter";
import type { TripItem } from "@/types/trip";

const items: TripItem[] = [
  {
    name: "teamLab Planets",
    latitude: 0,
    longitude: 0,
    startTime: "10:00",
    endTime: "12:00",
  },
];

describe("DayPlotter", () => {
  it("renders the selected date heading", () => {
    render(
      <DayPlotter
        date="2026-11-14"
        items={items}
        onChangeItems={vi.fn()}
      />
    );
    expect(screen.getByText(/14 Nov 2026/i)).toBeInTheDocument();
  });

  it("shows existing activities on the timeline", () => {
    render(
      <DayPlotter
        date="2026-11-14"
        items={items}
        onChangeItems={vi.fn()}
      />
    );
    expect(screen.getByText("teamLab Planets")).toBeInTheDocument();
    expect(screen.getByText("10:00–12:00")).toBeInTheDocument();
  });

  it("adds an activity with a start time", () => {
    const onChangeItems = vi.fn();
    render(
      <DayPlotter
        date="2026-11-14"
        items={[]}
        onChangeItems={onChangeItems}
      />
    );

    fireEvent.click(screen.getByText("+ Add activity"));
    fireEvent.change(screen.getByLabelText("Activity name"), {
      target: { value: "Ginza Lion" },
    });
    fireEvent.change(screen.getByLabelText("Start time"), {
      target: { value: "16:00" },
    });
    fireEvent.click(screen.getByText("Add"));

    expect(onChangeItems).toHaveBeenCalled();
    const next = onChangeItems.mock.calls[0][0] as TripItem[];
    expect(next).toHaveLength(1);
    expect(next[0].name).toBe("Ginza Lion");
    expect(next[0].startTime).toBe("16:00");
  });

  it("removes an activity", () => {
    const onChangeItems = vi.fn();
    render(
      <DayPlotter
        date="2026-11-14"
        items={items}
        onChangeItems={onChangeItems}
      />
    );
    fireEvent.click(screen.getByLabelText("Remove teamLab Planets"));
    expect(onChangeItems).toHaveBeenCalledWith([]);
  });
});
