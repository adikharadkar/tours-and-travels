import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, beforeEach } from "vitest";
import Dashboard from "./Dashboard";

describe("FleetCore Minimal Operational Dashboard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );
  };

  it("renders the dashboard header with greeting and quick action buttons", () => {
    renderDashboard();

    expect(
      screen.getByRole("heading", { name: "Operations Dashboard", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Live System/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ New Booking/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Invoice/i)).toBeInTheDocument();
  });

  it("renders the 5 core operational KPI metrics accurately", () => {
    renderDashboard();

    expect(screen.getByText("Today's Trips")).toBeInTheDocument();
    expect(screen.getAllByText("In Progress").length).toBeGreaterThan(0);
    expect(screen.getByText("Ready to Invoice")).toBeInTheDocument();
    expect(screen.getByText("Outstanding Receivables")).toBeInTheDocument();
    expect(screen.getByText("Attention Required")).toBeInTheDocument();
  });

  it("renders the Today's Operations list with active/scheduled routes", () => {
    renderDashboard();

    expect(
      screen.getByRole("heading", { name: "Today's Operations", level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText("All Trips")).toBeInTheDocument();
  });

  it("renders the Needs Attention section with urgent items", () => {
    renderDashboard();

    expect(
      screen.getByRole("heading", { name: "Needs Attention", level: 2 }),
    ).toBeInTheDocument();
  });

  it("renders the Billing Snapshot financial health overview", () => {
    renderDashboard();

    expect(
      screen.getByRole("heading", { name: "Billing Snapshot", level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Active receivables")).toBeInTheDocument();
    expect(screen.getByText("Paid This Month")).toBeInTheDocument();
  });

  it("renders Dedicated Modules quick shortcuts", () => {
    renderDashboard();

    expect(
      screen.getByRole("heading", { name: "Dedicated Modules", level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByText("Trips & Bookings")).toBeInTheDocument();
    expect(screen.getByText("Fleet Vehicles")).toBeInTheDocument();
    expect(screen.getByText("Driver Master")).toBeInTheDocument();
    expect(screen.getByText("Customer Directory")).toBeInTheDocument();
    expect(screen.getByText("Invoices & Billing")).toBeInTheDocument();
  });

  it("handles empty states gracefully when no records exist", () => {
    localStorage.setItem("trips", JSON.stringify([]));
    localStorage.setItem("invoices", JSON.stringify([]));
    localStorage.setItem("vehicles", JSON.stringify([]));
    localStorage.setItem("drivers", JSON.stringify([]));
    localStorage.setItem("customers", JSON.stringify([]));

    renderDashboard();

    expect(
      screen.getByText(/No active or scheduled journeys for today/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/All compliance items are in good standing/i),
    ).toBeInTheDocument();
  });

  it("allows refreshing the dashboard metrics", () => {
    renderDashboard();

    const refreshButton = screen.getByTitle("Refresh dashboard metrics");
    expect(refreshButton).toBeInTheDocument();
    fireEvent.click(refreshButton);
  });
});
