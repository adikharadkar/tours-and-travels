import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Loading from "./Loading";

describe("Loading", () => {
  it("renders with the default loading label", () => {
    render(<Loading />);

    expect(
      screen.getByRole("status", {
        name: "Loading...",
      }),
    ).toBeInTheDocument();
  });

  it("renders a custom loading label", () => {
    render(<Loading label="Loading invoices..." />);

    expect(
      screen.getByRole("status", {
        name: "Loading invoices...",
      }),
    ).toBeInTheDocument();
  });

  it("renders the spinner as decorative content", () => {
    const { container } = render(<Loading />);

    const spinner = container.querySelector('[aria-hidden="true"]');

    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("animate-spin");
  });

  it("renders without a visible label", () => {
    render(<Loading label="" />);

    expect(
      screen.getByRole("status", {
        name: "Loading",
      }),
    ).toBeInTheDocument();

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("uses the small spinner size", () => {
    const { container } = render(<Loading size="sm" />);

    const spinner = container.querySelector('[aria-hidden="true"]');

    expect(spinner).toHaveClass("h-4");
    expect(spinner).toHaveClass("w-4");
  });

  it("uses the medium spinner size by default", () => {
    const { container } = render(<Loading />);

    const spinner = container.querySelector('[aria-hidden="true"]');

    expect(spinner).toHaveClass("h-6");
    expect(spinner).toHaveClass("w-6");
  });

  it("uses the large spinner size", () => {
    const { container } = render(<Loading size="lg" />);

    const spinner = container.querySelector('[aria-hidden="true"]');

    expect(spinner).toHaveClass("h-8");
    expect(spinner).toHaveClass("w-8");
  });

  it("applies custom className", () => {
    render(<Loading className="custom-loading" />);

    expect(
      screen.getByRole("status", {
        name: "Loading...",
      }),
    ).toHaveClass("custom-loading");
  });

  it("renders the loading label", () => {
    render(<Loading label="Loading dashboard..." />);

    expect(screen.getByText("Loading dashboard...")).toBeInTheDocument();
  });
});
