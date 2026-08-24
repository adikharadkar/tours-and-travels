import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Header from "./Header";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { getHeaderConfig } from "../../config/headerConfig";

function renderHeader(initialRoute = "/dashboard") {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Header />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("Header Component", () => {
  it("renders correctly for Dashboard route", () => {
    renderHeader("/dashboard");

    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New Dispatch" }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search FleetCore..."),
    ).toBeInTheDocument();
  });

  it("renders dynamic action and breadcrumbs for Customers route", () => {
    renderHeader("/customers");

    expect(
      screen.getByRole("heading", { name: "Customers" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Masters")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New Customer" }),
    ).toBeInTheDocument();
  });

  it("renders dynamic action and breadcrumbs for Vehicles route", () => {
    renderHeader("/vehicles");

    expect(
      screen.getByRole("heading", { name: "Vehicles" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Masters")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New Vehicle" }),
    ).toBeInTheDocument();
  });

  it("renders dynamic action and breadcrumbs for Drivers route", () => {
    renderHeader("/drivers");

    expect(
      screen.getByRole("heading", { name: "Drivers" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Masters")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New Driver" }),
    ).toBeInTheDocument();
  });

  it("renders dynamic action and breadcrumbs for Trips route", () => {
    renderHeader("/trips");

    expect(
      screen.getByRole("heading", { name: "Trips / Bookings" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Operations")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New Trip" }),
    ).toBeInTheDocument();
  });

  it("renders Invoices section when on /trips?tab=invoices", () => {
    renderHeader("/trips?tab=invoices");

    expect(
      screen.getByRole("heading", { name: "Invoices" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New Invoice" }),
    ).toBeInTheDocument();
  });

  it("renders Payments section when on /trips?tab=payments", () => {
    renderHeader("/trips?tab=payments");

    expect(
      screen.getByRole("heading", { name: "Payments" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Record Payment" }),
    ).toBeInTheDocument();
  });

  it("renders Settings with no create action", () => {
    renderHeader("/settings");

    expect(
      screen.getByRole("heading", { name: "Settings" }),
    ).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /New /i }),
    ).not.toBeInTheDocument();
  });

  it("renders deeper route breadcrumbs with no create button (e.g. /customers/new)", () => {
    renderHeader("/customers/new");

    expect(
      screen.getByRole("heading", { name: "Add Customer" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Masters")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "New Customer" }),
    ).not.toBeInTheDocument();
  });

  it("toggles theme when theme button is clicked", async () => {
    const user = userEvent.setup();
    renderHeader("/dashboard");

    const themeButton = screen.getByRole("button", {
      name: /Switch to (dark|light) mode/i,
    });
    expect(themeButton).toBeInTheDocument();

    await user.click(themeButton);
    expect(document.documentElement).toHaveAttribute("data-theme");
  });

  it("opens notifications popover when notification bell is clicked", async () => {
    const user = userEvent.setup();
    renderHeader("/dashboard");

    const notifButton = screen.getByRole("button", { name: "Notifications" });
    expect(notifButton).toBeInTheDocument();

    await user.click(notifButton);
    expect(
      screen.getByRole("region", { name: "Notifications panel" }),
    ).toBeInTheDocument();
  });
});

describe("headerConfig resolver", () => {
  it("resolves route configs properly", () => {
    const custConfig = getHeaderConfig("/customers");
    expect(custConfig.title).toBe("Customers");
    expect(custConfig.section).toBe("Masters");
    expect(custConfig.primaryAction?.label).toBe("New Customer");

    const vehConfig = getHeaderConfig("/vehicles");
    expect(vehConfig.title).toBe("Vehicles");
    expect(vehConfig.section).toBe("Masters");
    expect(vehConfig.primaryAction?.label).toBe("New Vehicle");

    const drvConfig = getHeaderConfig("/drivers");
    expect(drvConfig.title).toBe("Drivers");
    expect(drvConfig.section).toBe("Masters");
    expect(drvConfig.primaryAction?.label).toBe("New Driver");

    const tripConfig = getHeaderConfig("/trips");
    expect(tripConfig.title).toBe("Trips / Bookings");
    expect(tripConfig.section).toBe("Operations");
    expect(tripConfig.primaryAction?.label).toBe("New Trip");
  });
});
