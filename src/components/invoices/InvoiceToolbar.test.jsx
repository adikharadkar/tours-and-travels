import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InvoiceToolbar from "./InvoiceToolbar";

const createProps = (overrides = {}) => ({
  documentType: "all",
  onDocumentTypeChange: vi.fn(),

  searchQuery: "",
  onSearchChange: vi.fn(),

  paymentStatus: "all",
  onPaymentStatusChange: vi.fn(),

  documentStatus: "all",
  onDocumentStatusChange: vi.fn(),

  datePreset: "all",
  onDatePresetChange: vi.fn(),

  customStartDate: "",
  onCustomStartDateChange: vi.fn(),

  customEndDate: "",
  onCustomEndDateChange: vi.fn(),

  customerFilter: "all",
  onCustomerFilterChange: vi.fn(),

  customers: [],
  onResetFilters: vi.fn(),

  activeFilterCount: 0,

  ...overrides,
});

describe("InvoiceToolbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // BASIC RENDERING
  // ---------------------------------------------------------------------------

  it("renders the search input", () => {
    render(<InvoiceToolbar {...createProps()} />);

    expect(
      screen.getByPlaceholderText(
        "Search by invoice #, customer, GSTIN, trip code, route...",
      ),
    ).toBeInTheDocument();
  });

  it("renders the date range filter", () => {
    render(<InvoiceToolbar {...createProps()} />);

    expect(
      screen.getByRole("combobox", {
        name: "Date Range Filter",
      }),
    ).toBeInTheDocument();
  });

  it("renders the More Filters button", () => {
    render(<InvoiceToolbar {...createProps()} />);

    expect(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    ).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // DOCUMENT TYPE
  // ---------------------------------------------------------------------------

  it("renders the document type controls", () => {
    render(<InvoiceToolbar {...createProps()} />);

    expect(
      screen.getByRole("button", { name: "All Invoices" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Tax Invoice" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Consolidated" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Proforma" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Credit Note" }),
    ).toBeInTheDocument();
  });

  it("calls onDocumentTypeChange when a document type is selected", () => {
    const props = createProps();

    render(<InvoiceToolbar {...props} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Tax Invoice",
      }),
    );

    expect(props.onDocumentTypeChange).toHaveBeenCalledWith("tax_invoice");
  });

  // ---------------------------------------------------------------------------
  // SEARCH
  // ---------------------------------------------------------------------------

  it("calls onSearchChange when the search input changes", () => {
    const props = createProps();

    render(<InvoiceToolbar {...props} />);

    const input = screen.getByPlaceholderText(
      "Search by invoice #, customer, GSTIN, trip code, route...",
    );

    fireEvent.change(input, {
      target: {
        value: "INV-2026-0001",
      },
    });

    expect(props.onSearchChange).toHaveBeenCalledWith("INV-2026-0001");
  });

  it("renders the current search query", () => {
    render(
      <InvoiceToolbar
        {...createProps({
          searchQuery: "Shree Logistics",
        })}
      />,
    );

    expect(screen.getByDisplayValue("Shree Logistics")).toBeInTheDocument();
  });

  it("shows the Clear search button when search query exists", () => {
    render(
      <InvoiceToolbar
        {...createProps({
          searchQuery: "INV-2026",
        })}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Clear search",
      }),
    ).toBeInTheDocument();
  });

  it("does not show the Clear search button when search query is empty", () => {
    render(<InvoiceToolbar {...createProps()} />);

    expect(
      screen.queryByRole("button", {
        name: "Clear search",
      }),
    ).not.toBeInTheDocument();
  });

  it("clears the search when Clear search is clicked", () => {
    const props = createProps({
      searchQuery: "INV-2026",
    });

    render(<InvoiceToolbar {...props} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Clear search",
      }),
    );

    expect(props.onSearchChange).toHaveBeenCalledWith("");
  });

  // ---------------------------------------------------------------------------
  // DATE FILTER
  // ---------------------------------------------------------------------------

  it("calls onDatePresetChange when date range changes", () => {
    const props = createProps();

    render(<InvoiceToolbar {...props} />);

    const select = screen.getByRole("combobox", {
      name: "Date Range Filter",
    });

    fireEvent.change(select, {
      target: {
        value: "custom",
      },
    });

    expect(props.onDatePresetChange).toHaveBeenCalledWith("custom");
  });

  // ---------------------------------------------------------------------------
  // MORE FILTERS
  // ---------------------------------------------------------------------------

  it("opens the More Filters dropdown", () => {
    render(<InvoiceToolbar {...createProps()} />);

    const moreButton = screen.getByRole("button", {
      name: "More Filters",
    });

    expect(moreButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(moreButton);

    expect(moreButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Filter Invoices")).toBeInTheDocument();
  });

  it("closes the More Filters dropdown when More Filters is clicked again", () => {
    render(<InvoiceToolbar {...createProps()} />);

    const moreButton = screen.getByRole("button", {
      name: "More Filters",
    });

    fireEvent.click(moreButton);

    expect(screen.getByText("Filter Invoices")).toBeInTheDocument();

    fireEvent.click(moreButton);

    expect(screen.queryByText("Filter Invoices")).not.toBeInTheDocument();

    expect(moreButton).toHaveAttribute("aria-expanded", "false");
  });

  it("renders payment and document status filters when More Filters is open", () => {
    render(<InvoiceToolbar {...createProps()} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    );

    expect(screen.getByText("Payment Status")).toBeInTheDocument();
    expect(screen.getByText("Document Status")).toBeInTheDocument();
    expect(screen.getByText("Customer")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // PAYMENT STATUS
  // ---------------------------------------------------------------------------

  it("calls onPaymentStatusChange when payment status changes", () => {
    const props = createProps();

    render(<InvoiceToolbar {...props} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    );

    const selects = screen.getAllByRole("combobox");

    const paymentStatusSelect = selects.find((select) =>
      Array.from(select.options).some((option) => option.value === "paid"),
    );

    expect(paymentStatusSelect).toBeDefined();

    fireEvent.change(paymentStatusSelect, {
      target: {
        value: "paid",
      },
    });

    expect(props.onPaymentStatusChange).toHaveBeenCalledWith("paid");
  });

  // ---------------------------------------------------------------------------
  // DOCUMENT STATUS
  // ---------------------------------------------------------------------------

  it("calls onDocumentStatusChange when document status changes", () => {
    const props = createProps();

    render(<InvoiceToolbar {...props} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    );

    const selects = screen.getAllByRole("combobox");

    const documentStatusSelect = selects.find((select) =>
      Array.from(select.options).some((option) => option.value === "issued"),
    );

    expect(documentStatusSelect).toBeDefined();

    fireEvent.change(documentStatusSelect, {
      target: {
        value: "issued",
      },
    });

    expect(props.onDocumentStatusChange).toHaveBeenCalledWith("issued");
  });

  // ---------------------------------------------------------------------------
  // CUSTOMER FILTER
  // ---------------------------------------------------------------------------

  it("renders customer options", () => {
    const customers = [
      {
        id: "customer-1",
        customerCode: "CUST-001",
        name: "Shree Logistics Pvt. Ltd.",
      },
      {
        id: "customer-2",
        customerCode: "CUST-002",
        name: "ABC Transport Pvt. Ltd.",
      },
    ];

    render(
      <InvoiceToolbar
        {...createProps({
          customers,
        })}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    );

    expect(
      screen.getByRole("option", {
        name: "Shree Logistics Pvt. Ltd. (CUST-001)",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("option", {
        name: "ABC Transport Pvt. Ltd. (CUST-002)",
      }),
    ).toBeInTheDocument();
  });

  it("calls onCustomerFilterChange when customer changes", () => {
    const props = createProps({
      customers: [
        {
          id: "customer-1",
          customerCode: "CUST-001",
          name: "Shree Logistics Pvt. Ltd.",
        },
      ],
    });

    render(<InvoiceToolbar {...props} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    );

    const customerSelect = screen
      .getAllByRole("combobox")
      .find((select) =>
        Array.from(select.options).some(
          (option) => option.value === "customer-1",
        ),
      );

    expect(customerSelect).toBeDefined();

    fireEvent.change(customerSelect, {
      target: {
        value: "customer-1",
      },
    });

    expect(props.onCustomerFilterChange).toHaveBeenCalledWith("customer-1");
  });

  // ---------------------------------------------------------------------------
  // ACTIVE FILTER COUNT / RESET
  // ---------------------------------------------------------------------------

  it("shows the active filter count on More Filters", () => {
    render(
      <InvoiceToolbar
        {...createProps({
          activeFilterCount: 3,
        })}
      />,
    );

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows Reset all when active filters exist", () => {
    render(
      <InvoiceToolbar
        {...createProps({
          activeFilterCount: 2,
        })}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    );

    expect(
      screen.getByRole("button", {
        name: /Reset all/,
      }),
    ).toBeInTheDocument();
  });

  it("does not show Reset all when there are no active filters", () => {
    render(<InvoiceToolbar {...createProps()} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    );

    expect(
      screen.queryByRole("button", {
        name: "Reset all",
      }),
    ).not.toBeInTheDocument();
  });

  it("calls onResetFilters when Reset all is clicked", () => {
    const props = createProps({
      activeFilterCount: 2,
    });

    render(<InvoiceToolbar {...props} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Reset all/,
      }),
    );

    expect(props.onResetFilters).toHaveBeenCalledTimes(1);
  });

  it("closes the dropdown after Reset all is clicked", () => {
    render(
      <InvoiceToolbar
        {...createProps({
          activeFilterCount: 2,
        })}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: /Reset all/i }));

    expect(screen.queryByText("Filter Invoices")).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // CUSTOM DATE RANGE
  // ---------------------------------------------------------------------------

  it("shows custom date fields when date preset is custom", () => {
    render(
      <InvoiceToolbar
        {...createProps({
          datePreset: "custom",
        })}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    );

    expect(screen.getByText("From Date")).toBeInTheDocument();
    expect(screen.getByText("To Date")).toBeInTheDocument();

    const dateInputs = document.querySelectorAll('input[type="date"]');

    expect(dateInputs.length).toBeGreaterThanOrEqual(2);
  });

  it("does not show custom date fields for non-custom date preset", () => {
    render(
      <InvoiceToolbar
        {...createProps({
          datePreset: "all",
        })}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    );

    expect(screen.queryByText("From Date")).not.toBeInTheDocument();

    expect(screen.queryByText("To Date")).not.toBeInTheDocument();
  });

  it("calls onCustomStartDateChange when start date changes", () => {
    const props = createProps({
      datePreset: "custom",
    });

    render(<InvoiceToolbar {...props} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    );

    const dateInputs = document.querySelectorAll('input[type="date"]');

    expect(dateInputs.length).toBeGreaterThanOrEqual(2);

    fireEvent.change(dateInputs[0], {
      target: {
        value: "2026-08-01",
      },
    });

    expect(props.onCustomStartDateChange).toHaveBeenCalledWith("2026-08-01");
  });

  it("calls onCustomEndDateChange when end date changes", () => {
    const props = createProps({
      datePreset: "custom",
    });

    render(<InvoiceToolbar {...props} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    );

    const dateInputs = document.querySelectorAll('input[type="date"]');

    expect(dateInputs.length).toBeGreaterThanOrEqual(2);

    fireEvent.change(dateInputs[1], {
      target: {
        value: "2026-08-31",
      },
    });

    expect(props.onCustomEndDateChange).toHaveBeenCalledWith("2026-08-31");
  });

  it("renders current custom date values", () => {
    render(
      <InvoiceToolbar
        {...createProps({
          datePreset: "custom",
          customStartDate: "2026-08-01",
          customEndDate: "2026-08-31",
        })}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    );

    expect(screen.getByDisplayValue("2026-08-01")).toBeInTheDocument();

    expect(screen.getByDisplayValue("2026-08-31")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // ACTIVE FILTER TAGS
  // ---------------------------------------------------------------------------

  it("shows payment status active filter tag", () => {
    render(
      <InvoiceToolbar
        {...createProps({
          activeFilterCount: 1,
          paymentStatus: "paid",
        })}
      />,
    );

    expect(screen.getByText("Payment: paid")).toBeInTheDocument();
  });

  it("shows document status active filter tag", () => {
    render(
      <InvoiceToolbar
        {...createProps({
          activeFilterCount: 1,
          documentStatus: "issued",
        })}
      />,
    );

    expect(screen.getByText("Doc: issued")).toBeInTheDocument();
  });

  it("shows customer active filter tag", () => {
    render(
      <InvoiceToolbar
        {...createProps({
          activeFilterCount: 1,
          customerFilter: "customer-1",
        })}
      />,
    );

    expect(screen.getByText("Customer")).toBeInTheDocument();
  });

  it("calls onPaymentStatusChange when payment filter tag is removed", () => {
    const props = createProps({
      activeFilterCount: 1,
      paymentStatus: "paid",
    });

    render(<InvoiceToolbar {...props} />);

    const paymentTag = screen.getByText("Payment: paid");

    const removeButton = paymentTag.parentElement?.querySelector("button");

    expect(removeButton).toBeTruthy();

    fireEvent.click(removeButton);

    expect(props.onPaymentStatusChange).toHaveBeenCalledWith("all");
  });

  it("calls onDocumentStatusChange when document filter tag is removed", () => {
    const props = createProps({
      activeFilterCount: 1,
      documentStatus: "issued",
    });

    render(<InvoiceToolbar {...props} />);

    const documentTag = screen.getByText("Doc: issued");

    const removeButton = documentTag.parentElement?.querySelector("button");

    expect(removeButton).toBeTruthy();

    fireEvent.click(removeButton);

    expect(props.onDocumentStatusChange).toHaveBeenCalledWith("all");
  });

  it("calls onCustomerFilterChange when customer filter tag is removed", () => {
    const props = createProps({
      activeFilterCount: 1,
      customerFilter: "customer-1",
    });

    render(<InvoiceToolbar {...props} />);

    const customerTag = screen.getByText("Customer");

    const removeButton = customerTag.parentElement?.querySelector("button");

    expect(removeButton).toBeTruthy();

    fireEvent.click(removeButton);

    expect(props.onCustomerFilterChange).toHaveBeenCalledWith("all");
  });

  // ---------------------------------------------------------------------------
  // CLEAR FILTERS
  // ---------------------------------------------------------------------------

  it("calls onResetFilters when Clear filters is clicked", () => {
    const props = createProps({
      activeFilterCount: 2,
      paymentStatus: "paid",
    });

    render(<InvoiceToolbar {...props} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Clear filters",
      }),
    );

    expect(props.onResetFilters).toHaveBeenCalledTimes(1);
  });

  // ---------------------------------------------------------------------------
  // DROPDOWN BEHAVIOR
  // ---------------------------------------------------------------------------

  it("closes More Filters when clicking outside", () => {
    render(<InvoiceToolbar {...createProps()} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    );

    expect(screen.getByText("Filter Invoices")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText("Filter Invoices")).not.toBeInTheDocument();
  });

  it("does not close More Filters when clicking inside the dropdown", () => {
    render(<InvoiceToolbar {...createProps()} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    );

    const filterTitle = screen.getByText("Filter Invoices");

    fireEvent.mouseDown(filterTitle);

    expect(screen.getByText("Filter Invoices")).toBeInTheDocument();
  });

  it("closes the dropdown when Apply is clicked", () => {
    render(<InvoiceToolbar {...createProps()} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "More Filters",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Apply",
      }),
    );

    expect(screen.queryByText("Filter Invoices")).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // ACTIVE FILTER COUNT
  // ---------------------------------------------------------------------------

  it("renders the active filter count only when greater than zero", () => {
    const { rerender } = render(
      <InvoiceToolbar
        {...createProps({
          activeFilterCount: 0,
        })}
      />,
    );

    expect(screen.queryByText("0")).not.toBeInTheDocument();

    rerender(
      <InvoiceToolbar
        {...createProps({
          activeFilterCount: 4,
        })}
      />,
    );

    expect(screen.getByText("4")).toBeInTheDocument();
  });
});
