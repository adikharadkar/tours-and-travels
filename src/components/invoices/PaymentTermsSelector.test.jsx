import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PaymentTermsSelector from "./PaymentTermsSelector";

describe("PaymentTermsSelector", () => {
  it("renders correctly with selected value", () => {
    render(
      <PaymentTermsSelector
        value="Net 30"
        onChange={() => {}}
        issueDate="2026-08-01"
        dueDate="2026-08-31"
      />,
    );

    expect(screen.getByText("Payment Terms *")).toBeInTheDocument();
    expect(screen.getByText("Net 30")).toBeInTheDocument();
  });

  it("opens dropdown menu and renders presets when clicked", () => {
    render(
      <PaymentTermsSelector
        value="Net 30"
        onChange={() => {}}
        issueDate="2026-08-01"
        dueDate="2026-08-31"
      />,
    );

    const trigger = screen.getByRole("button", { name: /Net 30/i });
    fireEvent.click(trigger);

    expect(screen.getByText("Immediate")).toBeInTheDocument();
    expect(screen.getByText("Net 7")).toBeInTheDocument();
    expect(screen.getByText("Net 15")).toBeInTheDocument();
    expect(screen.getByText("Net 45")).toBeInTheDocument();
    expect(screen.getByText("Net 60")).toBeInTheDocument();
  });

  it("calls onChange and updates dueDate when a preset is chosen", () => {
    const handleChange = vi.fn();
    const handleDueDateChange = vi.fn();

    render(
      <PaymentTermsSelector
        value="Net 30"
        onChange={handleChange}
        issueDate="2026-08-01"
        dueDate="2026-08-31"
        onDueDateChange={handleDueDateChange}
      />,
    );

    const trigger = screen.getByRole("button", { name: /Net 30/i });
    fireEvent.click(trigger);

    // Click Net 15
    const net15Btn = screen.getByRole("button", { name: /Net 15/i });
    fireEvent.click(net15Btn);

    expect(handleChange).toHaveBeenCalledWith("Net 15");
    expect(handleDueDateChange).toHaveBeenCalledWith("2026-08-16");
  });

  it("supports applying custom days", () => {
    const handleChange = vi.fn();
    const handleDueDateChange = vi.fn();

    render(
      <PaymentTermsSelector
        value="Net 30"
        onChange={handleChange}
        issueDate="2026-08-01"
        dueDate="2026-08-31"
        onDueDateChange={handleDueDateChange}
      />,
    );

    const trigger = screen.getByRole("button", { name: /Net 30/i });
    fireEvent.click(trigger);

    const input = screen.getByPlaceholderText("30");
    fireEvent.change(input, { target: { value: "20" } });

    const applyBtn = screen.getByRole("button", { name: "Apply" });
    fireEvent.click(applyBtn);

    expect(handleChange).toHaveBeenCalledWith("Net 20");
    expect(handleDueDateChange).toHaveBeenCalledWith("2026-08-21");
  });
});
