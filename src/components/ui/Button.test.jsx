import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Button from "./Button";

describe("Button", () => {
  it("renders correctly", () => {
    render(<Button>Click me</Button>);

    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("uses the primary variant by default", () => {
    render(<Button>Primary</Button>);

    expect(screen.getByRole("button")).toHaveClass(
      "bg-primary",
      "text-primary-foreground",
    );
  });

  it("supports the secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>);

    expect(screen.getByRole("button")).toHaveClass(
      "bg-surface",
      "text-foreground",
    );
  });

  it("supports the danger variant", () => {
    render(<Button variant="danger">Delete</Button>);

    expect(screen.getByRole("button")).toHaveClass("bg-red-600", "text-white");
  });

  it("supports the ghost variant", () => {
    render(<Button variant="ghost">Settings</Button>);

    expect(screen.getByRole("button")).toHaveClass("text-foreground");
  });

  it("supports different sizes", () => {
    render(<Button size="lg">Large</Button>);

    expect(screen.getByRole("button")).toHaveClass("h-11", "px-6", "text-base");
  });

  it("can be disabled", () => {
    render(<Button disabled>Disabled</Button>);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls the click handler", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(
      screen.getByRole("button", {
        name: "Click me",
      }),
    );

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("supports custom classes", () => {
    render(<Button className="custom-button">Custom</Button>);

    expect(screen.getByRole("button")).toHaveClass("custom-button");
  });
});
