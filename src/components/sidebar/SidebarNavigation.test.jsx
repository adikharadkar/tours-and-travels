import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import SidebarNavigation from "./SidebarNavigation";

const renderSidebarNavigation = (props = {}, initialEntries = ["/"]) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <SidebarNavigation {...props} />
    </MemoryRouter>,
  );
};

describe("SidebarNavigation", () => {
  it("renders all navigation sections in expanded mode", () => {
    renderSidebarNavigation({
      isCollapsed: false,
    });

    expect(
      screen.getByRole("heading", {
        name: "Overview",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Operations",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Masters",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Finance",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Insights",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "System",
      }),
    ).toBeInTheDocument();
  });

  it("renders all navigation items", () => {
    renderSidebarNavigation({
      isCollapsed: false,
    });

    const items = [
      "Dashboard",
      "Trips / Bookings",
      "Calendar",
      "Customers",
      "Vehicles",
      "Drivers",
      "Invoices",
      "Payments",
      "Ledger",
      "Reports",
      "Settings",
    ];

    items.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it("renders the default active trips count", () => {
    renderSidebarNavigation({
      isCollapsed: false,
    });

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders a custom active trips count", () => {
    renderSidebarNavigation({
      isCollapsed: false,
      activeTripsCount: 12,
    });

    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("passes collapsed state to navigation items", () => {
    renderSidebarNavigation({
      isCollapsed: true,
    });

    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();

    expect(screen.queryByText("Trips / Bookings")).not.toBeInTheDocument();

    expect(screen.queryByText("Customers")).not.toBeInTheDocument();

    expect(screen.queryByText("Vehicles")).not.toBeInTheDocument();

    expect(screen.queryByText("Drivers")).not.toBeInTheDocument();
  });

  it("keeps navigation links available when collapsed", () => {
    renderSidebarNavigation({
      isCollapsed: true,
    });

    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(11);

    const dashboardLink = links.find(
      (link) => link.getAttribute("title") === "Dashboard",
    );

    const tripsLink = links.find(
      (link) => link.getAttribute("title") === "Trips / Bookings",
    );

    const customersLink = links.find(
      (link) => link.getAttribute("title") === "Customers",
    );

    expect(dashboardLink).toBeDefined();
    expect(tripsLink).toBeDefined();
    expect(customersLink).toBeDefined();

    expect(dashboardLink).toHaveAttribute("href", "/dashboard");

    expect(tripsLink).toHaveAttribute("href", "/trips");

    expect(customersLink).toHaveAttribute("href", "/customers");
  });

  it("renders the correct routes", () => {
    renderSidebarNavigation({
      isCollapsed: false,
    });

    expect(
      screen.getByRole("link", {
        name: /Dashboard/,
      }),
    ).toHaveAttribute("href", "/dashboard");

    expect(
      screen.getByRole("link", {
        name: /Trips \/ Bookings/,
      }),
    ).toHaveAttribute("href", "/trips");

    expect(
      screen.getByRole("link", {
        name: /Calendar/,
      }),
    ).toHaveAttribute("href", "/trips?view=calendar");

    expect(
      screen.getByRole("link", {
        name: /Customers/,
      }),
    ).toHaveAttribute("href", "/customers");

    expect(
      screen.getByRole("link", {
        name: /Vehicles/,
      }),
    ).toHaveAttribute("href", "/vehicles");

    expect(
      screen.getByRole("link", {
        name: /Drivers/,
      }),
    ).toHaveAttribute("href", "/drivers");

    expect(
      screen.getByRole("link", {
        name: /Invoices/,
      }),
    ).toHaveAttribute("href", "/invoices");

    expect(
      screen.getByRole("link", {
        name: /Payments/,
      }),
    ).toHaveAttribute("href", "/trips?tab=payments");

    expect(
      screen.getByRole("link", {
        name: /Ledger/,
      }),
    ).toHaveAttribute("href", "/trips?tab=ledger");

    expect(
      screen.getByRole("link", {
        name: /Reports/,
      }),
    ).toHaveAttribute("href", "/dashboard?view=reports");

    expect(
      screen.getByRole("link", {
        name: /Settings/,
      }),
    ).toHaveAttribute("href", "/settings");
  });

  it("marks the Trips / Bookings route as active when on /trips", () => {
    renderSidebarNavigation(
      {
        isCollapsed: false,
      },
      ["/trips"],
    );

    const tripsLink = screen.getByRole("link", {
      name: /Trips \/ Bookings/,
    });

    expect(tripsLink).toHaveAttribute("aria-current", "page");
  });

  it("uses exact matching for Trips / Bookings", () => {
    renderSidebarNavigation(
      {
        isCollapsed: false,
      },
      ["/trips/123"],
    );

    const tripsLink = screen.getByRole("link", {
      name: /Trips \/ Bookings/,
    });

    expect(tripsLink).not.toHaveAttribute("aria-current", "page");
  });

  it("calls onItemClick when a navigation item is clicked", () => {
    const onItemClick = vi.fn();

    renderSidebarNavigation({
      isCollapsed: false,
      onItemClick,
    });

    fireEvent.click(
      screen.getByRole("link", {
        name: /Customers/,
      }),
    );

    expect(onItemClick).toHaveBeenCalledTimes(1);
  });

  it("passes the click event to onItemClick", () => {
    const onItemClick = vi.fn();

    renderSidebarNavigation({
      isCollapsed: false,
      onItemClick,
    });

    fireEvent.click(
      screen.getByRole("link", {
        name: /Vehicles/,
      }),
    );

    expect(onItemClick).toHaveBeenCalledTimes(1);
  });

  it("renders the navigation inside a nav element", () => {
    renderSidebarNavigation({
      isCollapsed: false,
    });

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("renders the default trip badge when no count is supplied", () => {
    renderSidebarNavigation();

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders zero when activeTripsCount is zero", () => {
    renderSidebarNavigation({
      activeTripsCount: 0,
    });

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders the Settings navigation item", () => {
    renderSidebarNavigation({
      isCollapsed: false,
    });

    expect(
      screen.getByRole("link", {
        name: /Settings/,
      }),
    ).toBeInTheDocument();
  });

  it("renders navigation items without duplicating them", () => {
    renderSidebarNavigation({
      isCollapsed: false,
    });

    expect(
      screen.getAllByRole("link", {
        name: /Dashboard/,
      }),
    ).toHaveLength(1);

    expect(
      screen.getAllByRole("link", {
        name: /Customers/,
      }),
    ).toHaveLength(1);

    expect(
      screen.getAllByRole("link", {
        name: /Vehicles/,
      }),
    ).toHaveLength(1);

    expect(
      screen.getAllByRole("link", {
        name: /Drivers/,
      }),
    ).toHaveLength(1);
  });
});
