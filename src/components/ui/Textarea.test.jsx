import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Textarea from "./Textarea";

describe("Textarea", () => {
  it("renders correctly", () => {
    render(<Textarea placeholder="Enter notes" />);

    expect(screen.getByPlaceholderText("Enter notes")).toBeInTheDocument();
  });

  it("uses four rows by default", () => {
    render(<Textarea placeholder="Enter notes" />);

    expect(screen.getByPlaceholderText("Enter notes")).toHaveAttribute(
      "rows",
      "4",
    );
  });

  it("supports custom rows", () => {
    render(<Textarea rows={8} placeholder="Enter notes" />);

    expect(screen.getByPlaceholderText("Enter notes")).toHaveAttribute(
      "rows",
      "8",
    );
  });

  it("can be disabled", () => {
    render(<Textarea disabled placeholder="Disabled" />);

    expect(screen.getByPlaceholderText("Disabled")).toBeDisabled();
  });

  it("accepts custom classes", () => {
    render(<Textarea className="custom-textarea" placeholder="Custom" />);

    expect(screen.getByPlaceholderText("Custom")).toHaveClass(
      "custom-textarea",
    );
  });

  it("accepts and updates its value", async () => {
    const user = userEvent.setup();

    render(<Textarea placeholder="Enter notes" />);

    const textarea = screen.getByPlaceholderText("Enter notes");

    await user.type(textarea, "Invoice notes");

    expect(textarea).toHaveValue("Invoice notes");
  });

  it("forwards the ref", () => {
    const ref = { current: null };

    render(<Textarea ref={ref} placeholder="Enter notes" />);

    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});
