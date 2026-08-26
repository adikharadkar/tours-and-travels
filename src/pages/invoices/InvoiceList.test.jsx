import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, beforeEach } from "vitest";
import InvoiceList from "./InvoiceList";
import { DEFAULT_INVOICES } from "../../services/invoiceService";

describe("InvoiceList Page", () => {
  beforeEach(() => {
    localStorage.setItem("invoices", JSON.stringify(DEFAULT_INVOICES));
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <InvoiceList />
      </BrowserRouter>,
    );
  };

  it("renders page title and header actions", async () => {
    renderComponent();

    expect(
      await screen.findByRole("heading", {
        name: "Invoices",
        level: 1,
      }),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole("button", {
        name: /\+ New Invoice/i,
      }),
    ).toBeInTheDocument();

    expect(
      await screen.getAllByRole("button", {
        name: /Export/i,
      }).length,
    ).toBeGreaterThan(0);
  });

  it("renders the 4 KPI summary cards", () => {
    renderComponent();

    expect(screen.getByText("Total Outstanding")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Drafts")).toBeInTheDocument();
    expect(screen.getByText("Received This Month")).toBeInTheDocument();
  });

  it("renders document type filter segments and filters table", () => {
    renderComponent();

    // Check segment buttons
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

    // Click on "Credit Note"
    fireEvent.click(screen.getByRole("button", { name: "Credit Note" }));
    expect(screen.getAllByText("CRN-2026-0012").length).toBeGreaterThan(0);
  });

  it("filters invoices based on search query", () => {
    renderComponent();

    const searchInputs = screen.getAllByPlaceholderText(/Search/i);
    // Find desktop search input
    const desktopSearch =
      searchInputs.find((input) => input.placeholder.includes("invoice #")) ||
      searchInputs[0];

    fireEvent.change(desktopSearch, { target: { value: "Apex Corporation" } });

    expect(screen.getAllByText("Apex Corporation").length).toBeGreaterThan(0);
  });

  it("opens the + New Invoice modal when button is clicked", () => {
    renderComponent();

    const newBtn = screen.getByRole("button", { name: /\+ New Invoice/i });
    fireEvent.click(newBtn);

    expect(
      screen.getByRole("heading", { name: "Create New Invoice" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Document Type *")).toBeInTheDocument();
  });

  it("opens the Export modal when Export is clicked", () => {
    renderComponent();

    const exportBtn = screen.getAllByRole("button", { name: /Export/i })[0];
    fireEvent.click(exportBtn);

    expect(
      screen.getByRole("heading", { name: "Export Invoices" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/CSV/i)).toBeInTheDocument();
  });

  it("opens mobile filter drawer when Filter button is clicked", () => {
    renderComponent();

    const filterBtn = screen.getByRole("button", { name: "Filter invoices" });
    fireEvent.click(filterBtn);

    expect(screen.getByText("Filter Invoices")).toBeInTheDocument();
  });

  it("renders mobile invoice cards with View Details and more actions", () => {
    renderComponent();

    const viewButtons = screen.getAllByRole("button", {
      name: /View Details/i,
    });
    expect(viewButtons.length).toBeGreaterThan(0);

    // Click View Details on first card to open modal
    fireEvent.click(viewButtons[0]);
    expect(screen.getByText("Line Items & Charges")).toBeInTheDocument();
  });

  it("renders empty state when search finds no match and clears filters", () => {
    renderComponent();

    const searchInputs = screen.getAllByPlaceholderText(/Search/i);
    const desktopSearch =
      searchInputs.find((input) => input.placeholder.includes("invoice #")) ||
      searchInputs[0];

    fireEvent.change(desktopSearch, {
      target: { value: "NON_EXISTENT_QUERY_12345" },
    });

    expect(screen.getByText("No matching invoices found")).toBeInTheDocument();

    // Click Clear Filters
    const clearBtn = screen.getByRole("button", { name: "Clear Filters" });
    fireEvent.click(clearBtn);

    expect(
      screen.queryByText("No matching invoices found"),
    ).not.toBeInTheDocument();
  });
});
