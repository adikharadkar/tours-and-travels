import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ErrorState from "./ErrorState";

describe("ErrorState", () => {
  it("renders the default title", () => {
    render(<ErrorState />);

    expect(
      screen.getByRole("heading", {
        name: "Something went wrong",
      }),
    ).toBeInTheDocument();
  });

  it("renders the default description", () => {
    render(<ErrorState />);

    expect(
      screen.getByText("We couldn't complete your request. Please try again."),
    ).toBeInTheDocument();
  });

  it("renders a custom title", () => {
    render(<ErrorState title="Unable to load invoices" />);

    expect(
      screen.getByRole("heading", {
        name: "Unable to load invoices",
      }),
    ).toBeInTheDocument();
  });

  it("renders a custom description", () => {
    render(
      <ErrorState description="Please check your connection and try again." />,
    );

    expect(
      screen.getByText("Please check your connection and try again."),
    ).toBeInTheDocument();
  });

  it("does not render the description when it is empty", () => {
    render(<ErrorState description="" />);

    expect(
      screen.queryByText(
        "We couldn't complete your request. Please try again.",
      ),
    ).not.toBeInTheDocument();
  });

  it("renders the icon", () => {
    render(<ErrorState icon={<span data-testid="error-icon">!</span>} />);

    expect(screen.getByTestId("error-icon")).toBeInTheDocument();
  });

  it("renders the action", () => {
    render(<ErrorState action={<button type="button">Try Again</button>} />);

    expect(
      screen.getByRole("button", {
        name: "Try Again",
      }),
    ).toBeInTheDocument();
  });

  it("does not render an action when it is not provided", () => {
    render(<ErrorState />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders with an alert role", () => {
    render(<ErrorState />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<ErrorState className="custom-error-state" />);

    expect(container.firstChild).toHaveClass("custom-error-state");
  });
});
