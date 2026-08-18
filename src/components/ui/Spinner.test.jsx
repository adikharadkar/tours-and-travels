import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Spinner from "./Spinner";

describe("Spinner", () => {
  it("renders with the loading status", () => {
    render(<Spinner />);

    expect(
      screen.getByRole("status", {
        name: "Loading",
      }),
    ).toBeInTheDocument();
  });

  it("uses the medium size by default", () => {
    render(<Spinner />);

    const spinner = screen.getByRole("status");

    expect(spinner).toHaveClass("h-6");
    expect(spinner).toHaveClass("w-6");
    expect(spinner).toHaveClass("border-2");
  });

  it("uses the small size", () => {
    render(<Spinner size="sm" />);

    const spinner = screen.getByRole("status");

    expect(spinner).toHaveClass("h-4");
    expect(spinner).toHaveClass("w-4");
    expect(spinner).toHaveClass("border-2");
  });

  it("uses the large size", () => {
    render(<Spinner size="lg" />);

    const spinner = screen.getByRole("status");

    expect(spinner).toHaveClass("h-8");
    expect(spinner).toHaveClass("w-8");
    expect(spinner).toHaveClass("border-2");
  });

  it("has the spinning animation", () => {
    render(<Spinner />);

    expect(screen.getByRole("status")).toHaveClass("animate-spin");
  });

  it("applies custom className", () => {
    render(<Spinner className="custom-spinner" />);

    expect(screen.getByRole("status")).toHaveClass("custom-spinner");
  });
});
