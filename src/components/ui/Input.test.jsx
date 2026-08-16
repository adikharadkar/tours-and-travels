import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Input from "./Input";

describe("Input", () => {
  it("renders correctly", () => {
    render(<Input placeholder="Enter name" />);

    expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
  });

  it("uses text input type by default", () => {
    render(<Input placeholder="Enter name" />);

    expect(screen.getByPlaceholderText("Enter name")).toHaveAttribute(
      "type",
      "text",
    );
  });

  it("supports different input types", () => {
    render(<Input type="email" placeholder="Enter email" />);

    expect(screen.getByPlaceholderText("Enter email")).toHaveAttribute(
      "type",
      "email",
    );
  });

  it("supports a placeholder", () => {
    render(<Input placeholder="Enter customer name" />);

    expect(
      screen.getByPlaceholderText("Enter customer name"),
    ).toBeInTheDocument();
  });

  it("can be disabled", () => {
    render(<Input disabled placeholder="Disabled input" />);

    expect(screen.getByPlaceholderText("Disabled input")).toBeDisabled();
  });

  it("accepts custom classes", () => {
    render(<Input className="custom-input" placeholder="Custom" />);

    expect(screen.getByPlaceholderText("Custom")).toHaveClass("custom-input");
  });

  it("accepts and updates its value", async () => {
    const user = userEvent.setup();

    render(<Input placeholder="Customer name" />);

    const input = screen.getByPlaceholderText("Customer name");

    await user.type(input, "John Doe");

    expect(input).toHaveValue("John Doe");
  });

  it("forwards the ref", () => {
    const ref = { current: null };

    render(<Input ref={ref} placeholder="Customer name" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
