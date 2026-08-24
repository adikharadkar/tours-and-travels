import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import Sidebar from "./Sidebar";

import { getTrips } from "../../services/tripService";

vi.mock("../../services/tripService", () => ({
  getTrips: vi.fn(),
}));

vi.mock("./SidebarBrand", () => ({
  default: ({ isCollapsed, onToggleCollapse, onCloseMobile }) => (
    <div data-testid="sidebar-brand">
      <span>{isCollapsed ? "Brand Collapsed" : "Brand Expanded"}</span>

      <button type="button" onClick={onToggleCollapse}>
        Toggle Collapse
      </button>

      <button type="button" onClick={onCloseMobile}>
        Close Mobile
      </button>
    </div>
  ),
}));

vi.mock("./SidebarNavigation", () => ({
  default: ({ isCollapsed, activeTripsCount, onItemClick }) => (
    <div data-testid="sidebar-navigation">
      <span>
        {isCollapsed ? "Navigation Collapsed" : "Navigation Expanded"}
      </span>

      <span>Active Trips: {activeTripsCount}</span>

      <button type="button" onClick={onItemClick}>
        Navigation Item
      </button>
    </div>
  ),
}));

vi.mock("./SidebarInsights", () => ({
  default: ({ activeCount, alertCount, isCollapsed }) => (
    <div data-testid="sidebar-insights">
      <span>Active: {activeCount}</span>

      <span>Alerts: {alertCount}</span>

      <span>{isCollapsed ? "Insights Collapsed" : "Insights Expanded"}</span>
    </div>
  ),
}));

vi.mock("./SidebarUser", () => ({
  default: ({ isCollapsed }) => (
    <div data-testid="sidebar-user">
      {isCollapsed ? "User Collapsed" : "User Expanded"}
    </div>
  ),
}));

const setStoredCollapseState = (value) => {
  localStorage.setItem("fleetcore_sidebar_collapsed", value);
};

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    getTrips.mockReturnValue([]);
  });

  it("renders the primary navigation aside", () => {
    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    expect(
      screen.getByRole("complementary", {
        name: "Primary Navigation",
      }),
    ).toBeInTheDocument();
  });

  it("renders all sidebar child sections", () => {
    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    expect(screen.getByTestId("sidebar-brand")).toBeInTheDocument();

    expect(screen.getByTestId("sidebar-navigation")).toBeInTheDocument();

    expect(screen.getByTestId("sidebar-insights")).toBeInTheDocument();

    expect(screen.getByTestId("sidebar-user")).toBeInTheDocument();
  });

  it("starts expanded when no collapse state is stored", () => {
    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    expect(screen.getByText("Brand Expanded")).toBeInTheDocument();

    expect(screen.getByText("Navigation Expanded")).toBeInTheDocument();

    expect(screen.getByText("Insights Expanded")).toBeInTheDocument();

    expect(screen.getByText("User Expanded")).toBeInTheDocument();
  });

  it("starts collapsed when localStorage contains true", () => {
    setStoredCollapseState("true");

    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    expect(screen.getByText("Brand Collapsed")).toBeInTheDocument();

    expect(screen.getByText("Navigation Collapsed")).toBeInTheDocument();

    expect(screen.getByText("Insights Collapsed")).toBeInTheDocument();

    expect(screen.getByText("User Collapsed")).toBeInTheDocument();
  });

  it("starts expanded when localStorage contains false", () => {
    setStoredCollapseState("false");

    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    expect(screen.getByText("Brand Expanded")).toBeInTheDocument();
  });

  it("toggles from expanded to collapsed", () => {
    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    expect(screen.getByText("Brand Expanded")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Toggle Collapse",
      }),
    );

    expect(screen.getByText("Brand Collapsed")).toBeInTheDocument();

    expect(screen.getByText("Navigation Collapsed")).toBeInTheDocument();

    expect(screen.getByText("Insights Collapsed")).toBeInTheDocument();

    expect(screen.getByText("User Collapsed")).toBeInTheDocument();
  });

  it("toggles from collapsed to expanded", () => {
    setStoredCollapseState("true");

    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    expect(screen.getByText("Brand Collapsed")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Toggle Collapse",
      }),
    );

    expect(screen.getByText("Brand Expanded")).toBeInTheDocument();

    expect(screen.getByText("Navigation Expanded")).toBeInTheDocument();
  });

  it("persists collapsed state to localStorage when collapsed", () => {
    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Toggle Collapse",
      }),
    );

    expect(localStorage.getItem("fleetcore_sidebar_collapsed")).toBe("true");
  });

  it("persists expanded state to localStorage when expanded", () => {
    setStoredCollapseState("true");

    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Toggle Collapse",
      }),
    );

    expect(localStorage.getItem("fleetcore_sidebar_collapsed")).toBe("false");
  });

  it("passes onCloseMobile to SidebarBrand", () => {
    const onCloseMobile = vi.fn();

    render(<Sidebar isOpenMobile={true} onCloseMobile={onCloseMobile} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close Mobile",
      }),
    );

    expect(onCloseMobile).toHaveBeenCalledTimes(1);
  });

  it("passes onCloseMobile to SidebarNavigation", () => {
    const onCloseMobile = vi.fn();

    render(<Sidebar isOpenMobile={true} onCloseMobile={onCloseMobile} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Navigation Item",
      }),
    );

    expect(onCloseMobile).toHaveBeenCalledTimes(1);
  });

  it("renders the mobile backdrop when isOpenMobile is true", () => {
    const { container } = render(
      <Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />,
    );

    const backdrop = container.querySelector('[aria-hidden="true"]');

    expect(backdrop).toBeInTheDocument();
  });

  it("renders the mobile backdrop when isOpenMobile is true", () => {
    const { container } = render(
      <Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />,
    );

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("calls onCloseMobile when the mobile backdrop is clicked", () => {
    const onCloseMobile = vi.fn();

    const { container } = render(
      <Sidebar isOpenMobile={true} onCloseMobile={onCloseMobile} />,
    );

    const backdrop = container.querySelector('[aria-hidden="true"]');

    expect(backdrop).toBeInTheDocument();

    fireEvent.click(backdrop);

    expect(onCloseMobile).toHaveBeenCalledTimes(1);
  });

  it("does not require onCloseMobile when mobile sidebar is not open", () => {
    expect(() => {
      render(<Sidebar isOpenMobile={false} />);
    }).not.toThrow();
  });

  it("uses default statistics when there are no trips", () => {
    getTrips.mockReturnValue([]);

    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    expect(screen.getByText("Active Trips: 3")).toBeInTheDocument();

    expect(screen.getByText("Active: 124")).toBeInTheDocument();

    expect(screen.getByText("Alerts: 3")).toBeInTheDocument();
  });

  it("uses default statistics when getTrips throws", () => {
    getTrips.mockImplementation(() => {
      throw new Error("Failed to load trips");
    });

    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    expect(screen.getByText("Active Trips: 3")).toBeInTheDocument();

    expect(screen.getByText("Active: 124")).toBeInTheDocument();

    expect(screen.getByText("Alerts: 3")).toBeInTheDocument();
  });

  it("calculates active trips from confirmed, ongoing, and scheduled trips", () => {
    getTrips.mockReturnValue([
      { status: "confirmed" },
      { status: "ongoing" },
      { status: "scheduled" },
      { status: "completed" },
    ]);

    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    expect(screen.getByText("Active Trips: 3")).toBeInTheDocument();
  });

  it("falls back to 3 active trips when no confirmed or ongoing trips exist", () => {
    getTrips.mockReturnValue([
      { status: "completed" },
      { status: "cancelled" },
    ]);

    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    /*
     * Because confirmedOrOngoing.length is 0,
     * the component uses its fallback value of 3.
     */
    expect(screen.getByText("Active Trips: 3")).toBeInTheDocument();
  });

  it("calculates total active as 120 plus total trip count", () => {
    getTrips.mockReturnValue([
      { status: "confirmed" },
      { status: "completed" },
      { status: "draft" },
      { status: "pending" },
      { status: "cancelled" },
    ]);

    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    expect(screen.getByText("Active: 125")).toBeInTheDocument();
  });

  it("calculates alerts from draft and pending trips", () => {
    getTrips.mockReturnValue([
      { status: "draft" },
      { status: "pending" },
      { status: "completed" },
    ]);

    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    expect(screen.getByText("Alerts: 2")).toBeInTheDocument();
  });

  it("falls back to 3 alerts when there are no draft or pending trips", () => {
    getTrips.mockReturnValue([
      { status: "confirmed" },
      { status: "completed" },
    ]);

    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    expect(screen.getByText("Alerts: 3")).toBeInTheDocument();
  });

  it("passes calculated statistics to SidebarInsights", () => {
    getTrips.mockReturnValue([
      { status: "confirmed" },
      { status: "scheduled" },
      { status: "draft" },
    ]);

    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    expect(screen.getByText("Active Trips: 2")).toBeInTheDocument();

    expect(screen.getByText("Active: 123")).toBeInTheDocument();

    expect(screen.getByText("Alerts: 1")).toBeInTheDocument();
  });

  it("recalculates statistics only after trips are available", () => {
    getTrips.mockReturnValue([{ status: "confirmed" }, { status: "pending" }]);

    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    expect(screen.getByText("Active Trips: 1")).toBeInTheDocument();

    expect(screen.getByText("Active: 122")).toBeInTheDocument();

    expect(screen.getByText("Alerts: 1")).toBeInTheDocument();
  });

  it("calls getTrips when the sidebar mounts", () => {
    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    expect(getTrips).toHaveBeenCalledTimes(1);
  });

  it("updates child components when collapse state changes", () => {
    render(<Sidebar isOpenMobile={true} onCloseMobile={vi.fn()} />);

    expect(screen.getByText("Navigation Expanded")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Toggle Collapse",
      }),
    );

    expect(screen.getByText("Navigation Collapsed")).toBeInTheDocument();

    expect(screen.getByText("Insights Collapsed")).toBeInTheDocument();

    expect(screen.getByText("User Collapsed")).toBeInTheDocument();
  });
});
