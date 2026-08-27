import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import CustomerList from "./CustomerList";
import * as customerService from "../../services/customerService";

const mockCustomers = [
  {
    id: "cust_1",
    name: "Perkins India Pvt Ltd",
    customerCode: "CUST-0001",
    customerType: "company",
    contactPerson: "Rajesh Sharma",
    mobile1: "9876543210",
    email: "rajesh@perkins.com",
    gstin: "27AABCP1234A1Z5",
    city: "Chhatrapati Sambhajinagar",
    state: "Maharashtra",
    outstandingAmount: 25000,
    financialStatus: "critical",
    paymentStatus: "Collections - Hold",
    isActive: true,
  },
  {
    id: "cust_2",
    name: "Jane Doe Travels",
    customerCode: "CUST-0002",
    customerType: "individual",
    contactPerson: "Jane Doe",
    mobile1: "9876543211",
    email: "jane@gmail.com",
    gstin: "",
    city: "Pune",
    state: "Maharashtra",
    outstandingAmount: 0,
    financialStatus: "healthy",
    paymentStatus: "Net 30 (Current)",
    isActive: true,
  },
  {
    id: "cust_3",
    name: "Bajaj Auto Limited",
    customerCode: "CUST-0003",
    customerType: "company",
    contactPerson: "Suresh Gupta",
    mobile1: "9876543212",
    email: "suresh@bajaj.com",
    gstin: "27AABCB5678B1Z2",
    city: "Waluj MIDC",
    state: "Maharashtra",
    outstandingAmount: 5400,
    financialStatus: "warning",
    paymentStatus: "14 Days Overdue",
    isActive: false,
  },
];

function renderWithRouter(component) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe("CustomerList Page", () => {
  beforeEach(() => {
    vi.spyOn(customerService, "getCustomers").mockReturnValue(mockCustomers);
  });

  it("renders page header and action buttons", () => {
    renderWithRouter(<CustomerList />);

    expect(screen.getByText("Customers Management")).toBeInTheDocument();
    expect(screen.getByText("New Customer")).toBeInTheDocument();
  });

  it("renders customer rows with proper data", () => {
    renderWithRouter(<CustomerList />);

    expect(screen.getAllByText("Perkins India Pvt Ltd").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Jane Doe Travels").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bajaj Auto Limited").length).toBeGreaterThan(0);

    expect(screen.getAllByText("CUST-0001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CUST-0002").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CUST-0003").length).toBeGreaterThan(0);
  });

  it("filters customer list by search input", () => {
    renderWithRouter(<CustomerList />);

    const searchInput = screen.getByPlaceholderText(
      /Search customers, ID, GSTIN.../i,
    );
    fireEvent.change(searchInput, { target: { value: "Perkins" } });

    expect(screen.getAllByText("Perkins India Pvt Ltd").length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText("Jane Doe Travels")).not.toBeInTheDocument();
  });

  it("handles select all checkboxes for batch actions", () => {
    renderWithRouter(<CustomerList />);

    const selectAllCheckbox = screen.getByLabelText(
      "Select all customers on this page",
    );
    fireEvent.click(selectAllCheckbox);

    expect(selectAllCheckbox).toBeChecked();
  });
});
