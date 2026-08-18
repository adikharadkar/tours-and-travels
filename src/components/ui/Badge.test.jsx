import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Badge from "./Badge";

describe("Badge", () => {
  it("renders its content", () => {
    render(<Badge>Pending</Badge>);

    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("uses the default variant", () => {
    render(<Badge>Default</Badge>);

    const badge = screen.getByText("Default");

    expect(badge).toHaveClass(
      "bg-background",
      "text-foreground",
      "border-border",
    );
  });

  it("uses the primary variant", () => {
    render(<Badge variant="primary">Primary</Badge>);

    const badge = screen.getByText("Primary");

    expect(badge).toHaveClass(
      "bg-primary/10",
      "text-primary",
      "border-primary/20",
    );
  });

  it("uses the success variant", () => {
    render(<Badge variant="success">Paid</Badge>);

    const badge = screen.getByText("Paid");

    expect(badge).toHaveClass(
      "bg-success/10",
      "text-success",
      "border-success/20",
    );
  });

  it("uses the warning variant", () => {
    render(<Badge variant="warning">Pending</Badge>);

    const badge = screen.getByText("Pending");

    expect(badge).toHaveClass(
      "bg-warning/10",
      "text-warning",
      "border-warning/20",
    );
  });

  it("uses the error variant", () => {
    render(<Badge variant="error">Failed</Badge>);

    const badge = screen.getByText("Failed");

    expect(badge).toHaveClass("bg-error/10", "text-error", "border-error/20");
  });

  it("falls back to the default variant for an unknown variant", () => {
    render(<Badge variant="unknown">Unknown</Badge>);

    const badge = screen.getByText("Unknown");

    expect(badge).toHaveClass(
      "bg-background",
      "text-foreground",
      "border-border",
    );
  });

  it("applies custom className", () => {
    render(<Badge className="custom-badge">Custom</Badge>);

    expect(screen.getByText("Custom")).toHaveClass("custom-badge");
  });

  it("renders different content", () => {
    render(
      <Badge>
        <span data-testid="badge-content">Active</span>
      </Badge>,
    );

    expect(screen.getByTestId("badge-content")).toBeInTheDocument();
  });
});
