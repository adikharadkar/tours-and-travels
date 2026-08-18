import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SearchInput from "./SearchInput";

describe("SearchInput", () => {
  it("renders the search input", () => {
    render(<SearchInput />);

    const input = screen.getByRole("searchbox");

    expect(input).toBeInTheDocument();
  });

  it("renders with the default placeholder", () => {
    render(<SearchInput />);

    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("renders a custom placeholder", () => {
    render(<SearchInput placeholder="Search invoices..." />);

    expect(
      screen.getByPlaceholderText("Search invoices..."),
    ).toBeInTheDocument();
  });

  it("renders the provided value", () => {
    render(<SearchInput value="invoice" onChange={() => {}} />);

    expect(screen.getByRole("searchbox")).toHaveValue("invoice");
  });

  it("calls onChange when the value changes", () => {
    const onChange = vi.fn();

    render(<SearchInput value="" onChange={onChange} />);

    const input = screen.getByRole("searchbox");

    fireEvent.change(input, {
      target: {
        value: "invoice",
      },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("passes the changed value through the change event", () => {
    const onChange = vi.fn();

    render(<SearchInput value="" onChange={onChange} />);

    const input = screen.getByRole("searchbox");

    fireEvent.change(input, {
      target: {
        value: "invoice",
      },
    });

    const event = onChange.mock.calls[0][0];

    expect(event).toBeDefined();
    expect(event.target).toBe(input);
  });

  it("renders as a controlled input", () => {
    const { rerender } = render(<SearchInput value="" onChange={() => {}} />);

    const input = screen.getByRole("searchbox");

    expect(input).toHaveValue("");

    rerender(<SearchInput value="invoice" onChange={() => {}} />);

    expect(input).toHaveValue("invoice");
  });

  it("is disabled when disabled is true", () => {
    render(<SearchInput disabled />);

    expect(screen.getByRole("searchbox")).toBeDisabled();
  });

  it("is enabled by default", () => {
    render(<SearchInput />);

    expect(screen.getByRole("searchbox")).not.toBeDisabled();
  });

  it("has autocomplete disabled", () => {
    render(<SearchInput />);

    expect(screen.getByRole("searchbox")).toHaveAttribute(
      "autocomplete",
      "off",
    );
  });

  it("supports a custom id", () => {
    render(<SearchInput id="invoice-search" />);

    const input = screen.getByRole("searchbox");

    expect(input).toHaveAttribute("id", "invoice-search");
  });

  it("generates an id when no id is provided", () => {
    render(<SearchInput />);

    const input = screen.getByRole("searchbox");

    expect(input).toHaveAttribute("id");
    expect(input.getAttribute("id")).toBeTruthy();
  });

  it("associates the input with the accessible Search label", () => {
    render(<SearchInput />);

    const input = screen.getByLabelText("Search");

    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "search");
  });

  it("supports a custom name", () => {
    render(<SearchInput name="invoiceSearch" />);

    expect(screen.getByRole("searchbox")).toHaveAttribute(
      "name",
      "invoiceSearch",
    );
  });

  it("forwards additional props to the input", () => {
    render(
      <SearchInput data-testid="search-input" aria-label="Invoice search" />,
    );

    const input = screen.getByTestId("search-input");

    expect(input).toHaveAttribute("aria-label", "Invoice search");
  });

  it("forwards the ref to the input", () => {
    const ref = { current: null };

    render(<SearchInput ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toHaveAttribute("type", "search");
  });

  it("applies a custom className", () => {
    render(<SearchInput className="custom-search" />);

    expect(screen.getByRole("searchbox")).toHaveClass("custom-search");
  });

  it("renders the search icon", () => {
    const { container } = render(<SearchInput />);

    const icon = container.querySelector("svg");

    expect(icon).toBeInTheDocument();
  });

  it("renders the search icon as decorative", () => {
    const { container } = render(<SearchInput />);

    const iconContainer = container.querySelector('span[aria-hidden="true"]');

    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveAttribute("aria-hidden", "true");
  });

  it("does not expose the decorative icon as an accessible element", () => {
    const { container } = render(<SearchInput />);

    const iconContainer = container.querySelector('span[aria-hidden="true"]');

    expect(iconContainer).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the input inside a full-width container", () => {
    const { container } = render(<SearchInput />);

    expect(container.firstElementChild).toHaveClass("w-full");
  });

  it("uses type search", () => {
    render(<SearchInput />);

    expect(screen.getByRole("searchbox")).toHaveAttribute("type", "search");
  });

  it("does not call onChange during initial render", () => {
    const onChange = vi.fn();

    render(<SearchInput onChange={onChange} />);

    expect(onChange).not.toHaveBeenCalled();
  });
});
