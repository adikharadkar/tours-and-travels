import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";

import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";
import ToastProvider from "./contexts/ToastProvider";

describe("App", () => {
  const renderWithRoute = (initialRoute = "/dashboard") => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <ThemeProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );
  };

  it("renders the application brand in header/sidebar", () => {
    renderWithRoute("/dashboard");
    expect(screen.getAllByText("FleetCore").length).toBeGreaterThan(0);
  });

  it("renders the Invoices page when navigating to /invoices", () => {
    renderWithRoute("/invoices");
    expect(
      screen.getAllByRole("heading", { name: /Invoices/i }).length,
    ).toBeGreaterThan(0);
  });

  it("renders the Dashboard page on root path redirect", () => {
    renderWithRoute("/");
    expect(
      screen.getAllByRole("heading", {
        name: /Fleet & Operations Dashboard|Dashboard/i,
      }).length,
    ).toBeGreaterThan(0);
  });

  it("renders the Customers page when navigating to /customers", () => {
    renderWithRoute("/customers");
    expect(
      screen.getAllByRole("heading", { name: /Customers/i }).length,
    ).toBeGreaterThan(0);
  });

  it("renders the Vehicles page when navigating to /vehicles", () => {
    renderWithRoute("/vehicles");
    expect(
      screen.getAllByRole("heading", { name: /Vehicles/i }).length,
    ).toBeGreaterThan(0);
  });

  it("renders the Drivers page when navigating to /drivers", () => {
    renderWithRoute("/drivers");
    expect(
      screen.getAllByRole("heading", { name: /Drivers/i }).length,
    ).toBeGreaterThan(0);
  });

  it("renders the Trips page when navigating to /trips", () => {
    renderWithRoute("/trips");
    expect(
      screen.getAllByRole("heading", { name: /Trip|Trips/i }).length,
    ).toBeGreaterThan(0);
  });

  it("renders the Settings page when navigating to /settings", () => {
    renderWithRoute("/settings");
    expect(
      screen.getAllByRole("heading", { name: /Settings/i }).length,
    ).toBeGreaterThan(0);
  });

  it("renders 404 page for unknown routes", () => {
    renderWithRoute("/non-existent-page");
    expect(screen.getByText("404")).toBeInTheDocument();
  });
});
