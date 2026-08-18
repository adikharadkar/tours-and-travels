import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Switch from "./Switch";

describe("Switch", () => {
  it("renders correctly", () => {
    render(<Switch aria-label="Enable notifications" />);

    expect(
      screen.getByRole("switch", {
        name: "Enable notifications",
      }),
    ).toBeInTheDocument();
  });

  it("is unchecked by default", () => {
    render(<Switch aria-label="Enable notifications" />);

    expect(
      screen.getByRole("switch", {
        name: "Enable notifications",
      }),
    ).not.toBeChecked();
  });

  it("can be turned on", async () => {
    const user = userEvent.setup();

    render(<Switch aria-label="Enable notifications" />);

    const switchElement = screen.getByRole("switch", {
      name: "Enable notifications",
    });

    await user.click(switchElement);

    expect(switchElement).toBeChecked();
  });

  it("can be turned off", async () => {
    const user = userEvent.setup();

    render(<Switch aria-label="Enable notifications" defaultChecked />);

    const switchElement = screen.getByRole("switch", {
      name: "Enable notifications",
    });

    expect(switchElement).toBeChecked();

    await user.click(switchElement);

    expect(switchElement).not.toBeChecked();
  });

  it("supports a default checked state", () => {
    render(<Switch aria-label="Enable notifications" defaultChecked />);

    expect(
      screen.getByRole("switch", {
        name: "Enable notifications",
      }),
    ).toBeChecked();
  });

  it("can be disabled", () => {
    render(<Switch aria-label="Enable notifications" disabled />);

    expect(
      screen.getByRole("switch", {
        name: "Enable notifications",
      }),
    ).toBeDisabled();
  });

  it("accepts custom classes", () => {
    render(
      <Switch aria-label="Enable notifications" className="custom-switch" />,
    );

    expect(
      screen.getByRole("switch", {
        name: "Enable notifications",
      }).parentElement,
    ).toHaveClass("custom-switch");
  });

  it("forwards the ref", () => {
    const ref = { current: null };

    render(<Switch ref={ref} aria-label="Enable notifications" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
