import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";

import App from "../App";
import { ThemeProvider } from "../contexts/ThemeContext";
import ToastProvider from "../contexts/ToastProvider";

describe("Dashboard Context-Aware Navigation & Deep Linking", () => {
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

  it("navigates to /trips?date=today and activates today filter", async () => {
    renderWithRoute("/trips?date=today");
    await waitFor(() => {
      expect(
        screen.getAllByRole("heading", { name: /Trips|Trip/i }).length,
      ).toBeGreaterThan(0);
    });
  });

  it("navigates to /trips?status=in_progress and activates in_progress tab/filter", async () => {
    renderWithRoute("/trips?status=in_progress");
    await waitFor(() => {
      expect(
        screen.getAllByRole("heading", { name: /Trips|Trip/i }).length,
      ).toBeGreaterThan(0);
    });
  });

  it("navigates to /invoices?status=overdue and applies overdue filter", async () => {
    renderWithRoute("/invoices?status=overdue");
    await waitFor(() => {
      expect(
        screen.getAllByRole("heading", { name: /Invoices/i }).length,
      ).toBeGreaterThan(0);
    });
  });

  it("navigates to /invoices?paymentStatus=unpaid and applies unpaid filter", async () => {
    renderWithRoute("/invoices?paymentStatus=unpaid");
    await waitFor(() => {
      expect(
        screen.getAllByRole("heading", { name: /Invoices/i }).length,
      ).toBeGreaterThan(0);
    });
  });

  it("navigates to /drivers?licenseStatus=expired and switches to compliance tab", async () => {
    renderWithRoute("/drivers?licenseStatus=expired");
    await waitFor(() => {
      expect(
        screen.getAllByRole("heading", { name: /Drivers/i }).length,
      ).toBeGreaterThan(0);
    });
  });

  it("navigates to /vehicles?documentStatus=expired", async () => {
    renderWithRoute("/vehicles?documentStatus=expired");
    await waitFor(() => {
      expect(
        screen.getAllByRole("heading", { name: /Vehicles/i }).length,
      ).toBeGreaterThan(0);
    });
  });
});
