import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EmptyState from "./EmptyState";

describe("EmptyState", () => {
  it("renders the default title", () => {
    render(<EmptyState />);

    expect(
      screen.getByRole("heading", {
        name: "No data found",
      }),
    ).toBeInTheDocument();
  });

  it("renders a custom title", () => {
    render(<EmptyState title="No invoices found" />);

    expect(
      screen.getByRole("heading", {
        name: "No invoices found",
      }),
    ).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(
      <EmptyState
        title="No invoices found"
        description="Create your first invoice to get started."
      />,
    );

    expect(
      screen.getByText("Create your first invoice to get started."),
    ).toBeInTheDocument();
  });

  it("does not render the description when it is not provided", () => {
    render(<EmptyState title="No invoices found" />);

    expect(
      screen.queryByText("Create your first invoice to get started."),
    ).not.toBeInTheDocument();
  });

  it("renders the icon", () => {
    render(
      <EmptyState
        title="No invoices found"
        icon={<span data-testid="empty-icon">+</span>}
      />,
    );

    expect(screen.getByTestId("empty-icon")).toBeInTheDocument();
  });

  it("renders the action", () => {
    render(
      <EmptyState
        title="No invoices found"
        action={<button type="button">Create Invoice</button>}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Create Invoice",
      }),
    ).toBeInTheDocument();
  });

  it("does not render an action when it is not provided", () => {
    render(<EmptyState title="No invoices found" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <EmptyState title="No invoices found" className="custom-empty-state" />,
    );

    expect(container.firstChild).toHaveClass("custom-empty-state");
  });
});
