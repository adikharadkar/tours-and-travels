import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Checkbox from "./Checkbox";

describe("Checkbox", () => {
  it("renders correctly", () => {
    render(<Checkbox aria-label="Accept terms" />);

    expect(
      screen.getByRole("checkbox", {
        name: "Accept terms",
      }),
    ).toBeInTheDocument();
  });

  it("is unchecked by default", () => {
    render(<Checkbox aria-label="Accept terms" />);

    expect(
      screen.getByRole("checkbox", {
        name: "Accept terms",
      }),
    ).not.toBeChecked();
  });

  it("can be checked by the user", async () => {
    const user = userEvent.setup();

    render(<Checkbox aria-label="Accept terms" />);

    const checkbox = screen.getByRole("checkbox", {
      name: "Accept terms",
    });

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it("can be unchecked by the user", async () => {
    const user = userEvent.setup();

    render(<Checkbox aria-label="Accept terms" defaultChecked />);

    const checkbox = screen.getByRole("checkbox", {
      name: "Accept terms",
    });

    expect(checkbox).toBeChecked();

    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
  });

  it("supports a default checked state", () => {
    render(<Checkbox aria-label="Accept terms" defaultChecked />);

    expect(
      screen.getByRole("checkbox", {
        name: "Accept terms",
      }),
    ).toBeChecked();
  });

  it("can be disabled", () => {
    render(<Checkbox aria-label="Accept terms" disabled />);

    expect(
      screen.getByRole("checkbox", {
        name: "Accept terms",
      }),
    ).toBeDisabled();
  });

  it("accepts custom classes", () => {
    render(<Checkbox aria-label="Accept terms" className="custom-checkbox" />);

    expect(
      screen.getByRole("checkbox", {
        name: "Accept terms",
      }),
    ).toHaveClass("custom-checkbox");
  });

  it("forwards the ref", () => {
    const ref = { current: null };

    render(<Checkbox ref={ref} aria-label="Accept terms" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
