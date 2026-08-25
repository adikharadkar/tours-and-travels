import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Header from "./Header";

import { getHeaderConfig } from "../../config/headerConfig";

vi.mock("../../config/headerConfig", () => ({
  getHeaderConfig: vi.fn(),
}));

vi.mock("./HeaderContext", () => ({
  default: ({ title, breadcrumbs = [] }) => (
    <div data-testid="header-context">
      <span data-testid="header-title">{title}</span>

      <span data-testid="header-breadcrumb-count">{breadcrumbs.length}</span>
    </div>
  ),
}));

vi.mock("./HeaderSearch", () => ({
  default: () => <div data-testid="header-search">Header Search</div>,
}));

vi.mock("./HeaderAction", () => ({
  default: ({ action }) =>
    action ? (
      <button type="button" data-testid="header-action">
        {action.label}
      </button>
    ) : null,
}));

vi.mock("./HeaderThemeToggle", () => ({
  default: () => (
    <button type="button" data-testid="header-theme-toggle">
      Theme Toggle
    </button>
  ),
}));

vi.mock("./HeaderNotifications", () => ({
  default: () => <div data-testid="header-notifications">Notifications</div>,
}));

vi.mock("./HeaderUser", () => ({
  default: () => <div data-testid="header-user">User</div>,
}));

const defaultConfig = {
  title: "Customers",
  breadcrumbs: [
    {
      label: "Masters",
      path: "/customers",
    },
    {
      label: "Customers",
    },
  ],
  primaryAction: {
    label: "New Customer",
    path: "/customers/new",
  },
};

const renderHeader = (initialEntries = ["/customers"], props = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Header {...props} />
    </MemoryRouter>,
  );
};

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getHeaderConfig.mockReturnValue(defaultConfig);
  });

  it("renders the header element", () => {
    renderHeader();

    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("gets the header configuration using the current pathname and search", () => {
    renderHeader(["/customers?status=active"]);

    expect(getHeaderConfig).toHaveBeenCalledTimes(1);

    expect(getHeaderConfig).toHaveBeenCalledWith(
      "/customers",
      "?status=active",
    );
  });

  it("renders the configured page title through HeaderContext", () => {
    renderHeader();

    expect(screen.getByTestId("header-title")).toHaveTextContent("Customers");
  });

  it("passes the configured breadcrumbs to HeaderContext", () => {
    renderHeader();

    expect(screen.getByTestId("header-breadcrumb-count")).toHaveTextContent(
      "2",
    );
  });

  it("renders HeaderSearch", () => {
    renderHeader();

    expect(screen.getAllByTestId("header-search")).toHaveLength(2);
  });

  it("renders HeaderUser for both mobile and desktop layouts", () => {
    renderHeader();

    expect(screen.getAllByTestId("header-user")).toHaveLength(2);
  });

  it("renders HeaderThemeToggle in the desktop layout", () => {
    renderHeader();

    expect(screen.getByTestId("header-theme-toggle")).toBeInTheDocument();
  });

  it("renders HeaderNotifications in the desktop layout", () => {
    renderHeader();

    expect(screen.getByTestId("header-notifications")).toBeInTheDocument();
  });

  it("renders the contextual action when configured", () => {
    renderHeader();

    expect(screen.getByTestId("header-action")).toHaveTextContent(
      "New Customer",
    );
  });

  it("does not render the contextual action when there is no primary action", () => {
    getHeaderConfig.mockReturnValue({
      ...defaultConfig,
      primaryAction: null,
    });

    renderHeader();

    expect(screen.queryByTestId("header-action")).not.toBeInTheDocument();
  });

  it("does not render the contextual action when primaryAction is undefined", () => {
    getHeaderConfig.mockReturnValue({
      title: "Reports",
      breadcrumbs: [
        {
          label: "Insights",
        },
        {
          label: "Reports",
        },
      ],
    });

    renderHeader();

    expect(screen.queryByTestId("header-action")).not.toBeInTheDocument();
  });

  it("renders a route-specific action for vehicles", () => {
    getHeaderConfig.mockReturnValue({
      title: "Vehicles",
      breadcrumbs: [
        {
          label: "Masters",
        },
        {
          label: "Vehicles",
        },
      ],
      primaryAction: {
        label: "New Vehicle",
        path: "/vehicles/new",
      },
    });

    renderHeader(["/vehicles"]);

    expect(screen.getByTestId("header-action")).toHaveTextContent(
      "New Vehicle",
    );
  });

  it("renders a route-specific action for drivers", () => {
    getHeaderConfig.mockReturnValue({
      title: "Drivers",
      breadcrumbs: [
        {
          label: "Masters",
        },
        {
          label: "Drivers",
        },
      ],
      primaryAction: {
        label: "New Driver",
        path: "/drivers/new",
      },
    });

    renderHeader(["/drivers"]);

    expect(screen.getByTestId("header-action")).toHaveTextContent("New Driver");
  });

  it("renders a route-specific action for trips", () => {
    getHeaderConfig.mockReturnValue({
      title: "Trips / Bookings",
      breadcrumbs: [
        {
          label: "Operations",
        },
        {
          label: "Trips / Bookings",
        },
      ],
      primaryAction: {
        label: "New Trip",
        path: "/trips/new",
      },
    });

    renderHeader(["/trips"]);

    expect(screen.getByTestId("header-action")).toHaveTextContent("New Trip");
  });

  it("renders a route-specific action for invoices", () => {
    getHeaderConfig.mockReturnValue({
      title: "Invoices",
      breadcrumbs: [
        {
          label: "Finance",
        },
        {
          label: "Invoices",
        },
      ],
      primaryAction: {
        label: "New Invoice",
        path: "/invoices/new",
      },
    });

    renderHeader(["/invoices"]);

    expect(screen.getByTestId("header-action")).toHaveTextContent(
      "New Invoice",
    );
  });

  it("renders a route-specific payment action", () => {
    getHeaderConfig.mockReturnValue({
      title: "Payments",
      breadcrumbs: [
        {
          label: "Finance",
        },
        {
          label: "Payments",
        },
      ],
      primaryAction: {
        label: "Record Payment",
        path: "/payments/new",
      },
    });

    renderHeader(["/payments"]);

    expect(screen.getByTestId("header-action")).toHaveTextContent(
      "Record Payment",
    );
  });

  it("supports pages without a primary action", () => {
    getHeaderConfig.mockReturnValue({
      title: "Settings",
      breadcrumbs: [
        {
          label: "System",
        },
        {
          label: "Settings",
        },
      ],
      primaryAction: null,
    });

    renderHeader(["/settings"]);

    expect(screen.getByTestId("header-title")).toHaveTextContent("Settings");

    expect(screen.queryByTestId("header-action")).not.toBeInTheDocument();

    expect(screen.getByTestId("header-theme-toggle")).toBeInTheDocument();

    expect(screen.getByTestId("header-notifications")).toBeInTheDocument();

    expect(screen.getAllByTestId("header-user")).toHaveLength(2);
  });

  it("calls onOpenMobile when the mobile navigation button is clicked", () => {
    const onOpenMobile = vi.fn();

    renderHeader(["/customers"], {
      onOpenMobile,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Open navigation",
      }),
    );

    expect(onOpenMobile).toHaveBeenCalledTimes(1);
  });

  it("renders the mobile FleetCore brand link", () => {
    renderHeader();

    expect(
      screen.getByRole("link", {
        name: "FleetCore",
      }),
    ).toHaveAttribute("href", "/dashboard");
  });

  it("renders the mobile navigation button", () => {
    renderHeader();

    expect(
      screen.getByRole("button", {
        name: "Open navigation",
      }),
    ).toBeInTheDocument();
  });

  it("renders search in the mobile and desktop header zones", () => {
    renderHeader();

    expect(screen.getAllByTestId("header-search")).toHaveLength(2);
  });

  it("does not call onOpenMobile during initial render", () => {
    const onOpenMobile = vi.fn();

    renderHeader(["/customers"], {
      onOpenMobile,
    });

    expect(onOpenMobile).not.toHaveBeenCalled();
  });

  it("works without an onOpenMobile callback", () => {
    expect(() => {
      renderHeader();
    }).not.toThrow();
  });

  it("renders the configured notification area once", () => {
    renderHeader();

    expect(screen.getAllByTestId("header-notifications")).toHaveLength(1);
  });

  it("renders the configured theme toggle once", () => {
    renderHeader();

    expect(screen.getAllByTestId("header-theme-toggle")).toHaveLength(1);
  });

  it("updates the displayed title when the route changes", () => {
    const { rerender } = renderHeader(["/customers"]);

    expect(screen.getByTestId("header-title")).toHaveTextContent("Customers");

    getHeaderConfig.mockReturnValue({
      title: "Vehicles",
      breadcrumbs: [
        {
          label: "Masters",
        },
        {
          label: "Vehicles",
        },
      ],
      primaryAction: {
        label: "New Vehicle",
        path: "/vehicles/new",
      },
    });

    rerender(
      <MemoryRouter initialEntries={["/vehicles"]}>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("header-title")).toHaveTextContent("Vehicles");
  });

  it("supports a header configuration with no breadcrumbs", () => {
    getHeaderConfig.mockReturnValue({
      title: "Dashboard",
      breadcrumbs: [],
      primaryAction: null,
    });

    renderHeader(["/dashboard"]);

    expect(screen.getByTestId("header-title")).toHaveTextContent("Dashboard");

    expect(screen.getByTestId("header-breadcrumb-count")).toHaveTextContent(
      "0",
    );
  });

  it("passes the current route search to getHeaderConfig", () => {
    getHeaderConfig.mockReturnValue(defaultConfig);

    renderHeader(["/trips?view=calendar"]);

    expect(getHeaderConfig).toHaveBeenCalledWith("/trips", "?view=calendar");
  });
});
