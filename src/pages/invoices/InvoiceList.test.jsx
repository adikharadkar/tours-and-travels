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
      screen.getByRole("heading", { name: "Invoices", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /\+ New Invoice/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export/i })).toBeInTheDocument();
  });

  it("renders the 4 KPI summary cards", async () => {
    renderComponent();

    expect(screen.getByText("Total Outstanding")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Drafts")).toBeInTheDocument();
    expect(screen.getByText("Received This Month")).toBeInTheDocument();
  });

  it("renders document type filter segments and filters table", async () => {
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

  it("filters invoices based on search query", async () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText(/Search by invoice #/i);
    fireEvent.change(searchInput, { target: { value: "Apex Corporation" } });

    expect(screen.getAllByText("Apex Corporation").length).toBeGreaterThan(0);
  });

  it("opens the + New Invoice modal when button is clicked", async () => {
    renderComponent();

    const newBtn = screen.getByRole("button", { name: /\+ New Invoice/i });
    fireEvent.click(newBtn);

    expect(
      screen.getByRole("heading", { name: "Create New Invoice" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Document Type *")).toBeInTheDocument();
  });

  it("opens the Export modal when Export is clicked", async () => {
    renderComponent();

    const exportBtn = screen.getByRole("button", { name: /Export/i });
    fireEvent.click(exportBtn);

    expect(
      screen.getByRole("heading", { name: "Export Invoices" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/CSV \/ Excel Spreadsheet/i)).toBeInTheDocument();
  });
});
