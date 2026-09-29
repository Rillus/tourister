import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TripViewToggle } from "./trip-view-toggle";

describe("TripViewToggle", () => {
  it("marks the active view and switches on click", () => {
    const onChange = vi.fn();
    render(<TripViewToggle value="map" onChange={onChange} />);

    expect(screen.getByRole("tab", { name: "Map" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tab", { name: "Plotter" })).toHaveAttribute(
      "aria-selected",
      "false"
    );

    fireEvent.click(screen.getByRole("tab", { name: "Plotter" }));
    expect(onChange).toHaveBeenCalledWith("plotter");
  });
});
