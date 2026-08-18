import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Label from "./Label";

describe("Label", () => {
  it("renders correctly", () => {
    render(<Label>Customer name</Label>);

    expect(screen.getByText("Customer name")).toBeInTheDocument();
  });

  it("supports htmlFor", () => {
    render(<Label htmlFor="customer-name">Customer name</Label>);

    expect(screen.getByText("Customer name")).toHaveAttribute(
      "for",
      "customer-name",
    );
  });

  it("accepts custom classes", () => {
    render(<Label className="custom-label">Customer name</Label>);

    expect(screen.getByText("Customer name")).toHaveClass("custom-label");
  });

  it("forwards the ref", () => {
    const ref = { current: null };

    render(<Label ref={ref}>Customer name</Label>);

    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it("associates with an input", () => {
    render(
      <div>
        <Label htmlFor="customer-name">Customer name</Label>

        <input id="customer-name" />
      </div>,
    );

    expect(screen.getByLabelText("Customer name")).toBeInTheDocument();
  });
});
