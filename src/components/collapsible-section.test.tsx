import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CollapsibleSection } from "./collapsible-section";

describe("CollapsibleSection", () => {
  it("shows children when expanded", () => {
    render(
      <CollapsibleSection
        id="summary"
        title="Summary"
        collapsed={false}
        onCollapsedChange={vi.fn()}
      >
        <p>Body content</p>
      </CollapsibleSection>
    );
    expect(screen.getByText("Body content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /summary/i })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("hides children when collapsed", () => {
    render(
      <CollapsibleSection
        id="calendar"
        title="Calendar"
        collapsed
        onCollapsedChange={vi.fn()}
      >
        <p>Hidden body</p>
      </CollapsibleSection>
    );
    expect(screen.queryByText("Hidden body")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /calendar/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("notifies when the header is clicked", () => {
    const onCollapsedChange = vi.fn();
    render(
      <CollapsibleSection
        id="stops"
        title="Stops"
        collapsed={false}
        onCollapsedChange={onCollapsedChange}
      >
        <p>Stops list</p>
      </CollapsibleSection>
    );
    fireEvent.click(screen.getByRole("button", { name: /stops/i }));
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
  });
});
