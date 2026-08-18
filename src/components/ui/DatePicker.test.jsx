import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DatePicker from "./DatePicker";

describe("DatePicker", () => {
  it("renders the date input", () => {
    render(<DatePicker />);

    const input = document.querySelector('input[type="date"]');

    expect(input).toBeInTheDocument();
  });

  it("renders with a label", () => {
    render(<DatePicker label="Invoice Date" />);

    expect(screen.getByText("Invoice Date")).toBeInTheDocument();
  });

  it("sets the initial value", () => {
    render(<DatePicker value="2026-08-18" />);

    const input = document.querySelector('input[type="date"]');

    expect(input).toHaveValue("2026-08-18");
  });

  it("renders an empty value by default", () => {
    render(<DatePicker />);

    const input = document.querySelector('input[type="date"]');

    expect(input).toHaveValue("");
  });

  // it("passes the selected date to onChange", () => {
  //   const onChange = vi.fn();

  //   const { rerender } = render(<DatePicker value="" onChange={onChange} />);

  //   const input = document.querySelector('input[type="date"]');

  //   fireEvent.change(input, {
  //     target: {
  //       value: "2026-08-18",
  //     },
  //   });

  //   expect(onChange).toHaveBeenCalledTimes(1);

  //   const event = onChange.mock.calls[0][0];

  //   expect(event.target.value).toBe("2026-08-18");
  // });

  it("supports a minimum date", () => {
    render(<DatePicker min="2026-01-01" />);

    const input = document.querySelector('input[type="date"]');

    expect(input).toHaveAttribute("min", "2026-01-01");
  });

  it("supports a maximum date", () => {
    render(<DatePicker max="2026-12-31" />);

    const input = document.querySelector('input[type="date"]');

    expect(input).toHaveAttribute("max", "2026-12-31");
  });

  it("supports both minimum and maximum dates", () => {
    render(<DatePicker min="2026-01-01" max="2026-12-31" />);

    const input = document.querySelector('input[type="date"]');

    expect(input).toHaveAttribute("min", "2026-01-01");
    expect(input).toHaveAttribute("max", "2026-12-31");
  });

  it("supports the required attribute", () => {
    render(<DatePicker label="Invoice Date" required />);

    const input = document.querySelector('input[type="date"]');

    expect(input).toBeRequired();
  });

  it("shows the required indicator when required", () => {
    render(<DatePicker label="Invoice Date" required />);

    expect(screen.getByText("Invoice Date")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("does not show the required indicator when not required", () => {
    render(<DatePicker label="Invoice Date" />);

    expect(screen.getByText("Invoice Date")).toBeInTheDocument();
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("supports disabled state", () => {
    render(<DatePicker disabled />);

    const input = document.querySelector('input[type="date"]');

    expect(input).toBeDisabled();
  });

  it("supports a custom id", () => {
    render(<DatePicker id="invoice-date" />);

    const input = document.querySelector('input[type="date"]');

    expect(input).toHaveAttribute("id", "invoice-date");
  });

  it("connects the label to the input", () => {
    render(<DatePicker id="invoice-date" label="Invoice Date" />);

    const label = screen.getByText("Invoice Date");

    expect(label).toHaveAttribute("for", "invoice-date");
  });

  it("supports a custom className", () => {
    render(<DatePicker className="custom-date-picker" />);

    const wrapper = document.querySelector(".custom-date-picker");

    expect(wrapper).toBeInTheDocument();
  });

  it("supports placeholder text when provided", () => {
    render(<DatePicker placeholder="Select date" />);

    const input = document.querySelector('input[type="date"]');

    expect(input).toHaveAttribute("placeholder", "Select date");
  });

  it("supports aria-invalid", () => {
    render(<DatePicker error />);

    const input = document.querySelector('input[type="date"]');

    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("renders error message", () => {
    render(
      <DatePicker label="Invoice Date" error="Invoice date is required" />,
    );

    expect(screen.getByText("Invoice date is required")).toBeInTheDocument();
  });

  it("renders helper text", () => {
    render(<DatePicker helperText="Select the invoice date" />);

    expect(screen.getByText("Select the invoice date")).toBeInTheDocument();
  });

  it("does not render an error message when error is not provided", () => {
    render(<DatePicker />);

    expect(
      screen.queryByText("Invoice date is required"),
    ).not.toBeInTheDocument();
  });

  it("forwards additional props to the input", () => {
    render(<DatePicker name="invoiceDate" data-testid="invoice-date" />);

    const input = document.querySelector('input[type="date"]');

    expect(input).toHaveAttribute("name", "invoiceDate");
    expect(input).toHaveAttribute("data-testid", "invoice-date");
  });

  it("fires onBlur", () => {
    const onBlur = vi.fn();

    render(<DatePicker onBlur={onBlur} />);

    const input = document.querySelector('input[type="date"]');

    fireEvent.blur(input);

    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("fires onFocus", () => {
    const onFocus = vi.fn();

    render(<DatePicker onFocus={onFocus} />);

    const input = document.querySelector('input[type="date"]');

    fireEvent.focus(input);

    expect(onFocus).toHaveBeenCalledTimes(1);
  });
});
