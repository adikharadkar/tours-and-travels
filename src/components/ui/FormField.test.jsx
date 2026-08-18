import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import FormField from "./FormField";
import Input from "./Input";

function renderInputField(props = {}) {
  return render(
    <FormField {...props}>
      {(fieldProps) => (
        <Input {...fieldProps} placeholder="Enter customer name" />
      )}
    </FormField>,
  );
}

describe("FormField", () => {
  it("renders the label and input", () => {
    renderInputField({
      label: "Customer name",
    });

    expect(screen.getByLabelText("Customer name")).toBeInTheDocument();
  });

  it("associates the label with the input", () => {
    renderInputField({
      label: "Customer name",
    });

    const input = screen.getByLabelText("Customer name");
    const label = screen.getByText("Customer name");

    expect(label).toHaveAttribute("for", input.getAttribute("id"));
  });

  it("renders a description", () => {
    renderInputField({
      label: "Customer name",
      description: "Enter the customer's full name.",
    });

    expect(
      screen.getByText("Enter the customer's full name."),
    ).toBeInTheDocument();
  });

  it("renders an error message", () => {
    renderInputField({
      label: "Customer name",
      error: "Customer name is required.",
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Customer name is required.",
    );
  });

  it("does not render the description when there is an error", () => {
    renderInputField({
      label: "Customer name",
      description: "Enter the customer's full name.",
      error: "Customer name is required.",
    });

    expect(
      screen.queryByText("Enter the customer's full name."),
    ).not.toBeInTheDocument();
  });

  it("marks the field as invalid when there is an error", () => {
    renderInputField({
      label: "Customer name",
      error: "Customer name is required.",
    });

    expect(screen.getByLabelText("Customer name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("associates the error with the input", () => {
    renderInputField({
      label: "Customer name",
      error: "Customer name is required.",
    });

    const input = screen.getByLabelText("Customer name");
    const error = screen.getByRole("alert");

    expect(input.getAttribute("aria-describedby")).toContain(
      error.getAttribute("id"),
    );
  });

  it("marks a required field", () => {
    renderInputField({
      label: "Customer name",
      required: true,
    });

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("passes field props to the control", async () => {
    const user = userEvent.setup();

    renderInputField({
      label: "Customer name",
    });

    const input = screen.getByLabelText("Customer name");

    await user.type(input, "John Doe");

    expect(input).toHaveValue("John Doe");
  });

  it("supports custom classes", () => {
    const { container } = renderInputField({
      label: "Customer name",
      className: "custom-field",
    });

    expect(container.firstChild).toHaveClass("custom-field");
  });
});
