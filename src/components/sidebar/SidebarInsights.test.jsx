import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import SidebarInsights from "./SidebarInsights";

describe("SidebarInsights", () => {
  it("renders default active and alert counts in expanded mode", () => {
    render(<SidebarInsights isCollapsed={false} />);

    expect(screen.getByText("Active")).toBeInTheDocument();

    expect(screen.getByText("Alerts")).toBeInTheDocument();

    expect(screen.getByText("124")).toBeInTheDocument();

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders custom active and alert counts", () => {
    render(
      <SidebarInsights isCollapsed={false} activeCount={42} alertCount={7} />,
    );

    expect(screen.getByText("42")).toBeInTheDocument();

    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders the active and alerts labels in expanded mode", () => {
    render(
      <SidebarInsights isCollapsed={false} activeCount={10} alertCount={2} />,
    );

    expect(screen.getByText("Active")).toBeInTheDocument();

    expect(screen.getByText("Alerts")).toBeInTheDocument();
  });

  it("renders the collapsed summary", () => {
    render(<SidebarInsights isCollapsed activeCount={42} alertCount={5} />);

    expect(screen.getByText("42")).toBeInTheDocument();

    expect(screen.queryByText("Active")).not.toBeInTheDocument();

    expect(screen.queryByText("Alerts")).not.toBeInTheDocument();
  });

  it("renders 99+ for active counts greater than 99 in collapsed mode", () => {
    render(<SidebarInsights isCollapsed activeCount={124} alertCount={3} />);

    expect(screen.getByText("99+")).toBeInTheDocument();

    expect(screen.queryByText("124")).not.toBeInTheDocument();
  });

  it("renders the exact active count when it is 99 in collapsed mode", () => {
    render(<SidebarInsights isCollapsed activeCount={99} alertCount={3} />);

    expect(screen.getByText("99")).toBeInTheDocument();

    expect(screen.queryByText("99+")).not.toBeInTheDocument();
  });

  it("renders the exact active count when it is below 99 in collapsed mode", () => {
    render(<SidebarInsights isCollapsed activeCount={12} alertCount={4} />);

    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("renders the collapsed tooltip with active and alert counts", () => {
    render(<SidebarInsights isCollapsed activeCount={42} alertCount={5} />);

    const summary = screen.getByTitle("Active: 42 | Alerts: 5");

    expect(summary).toBeInTheDocument();
  });

  it("uses default counts in the collapsed tooltip", () => {
    render(<SidebarInsights isCollapsed />);

    expect(screen.getByTitle("Active: 124 | Alerts: 3")).toBeInTheDocument();
  });

  it("renders zero counts correctly in expanded mode", () => {
    render(
      <SidebarInsights isCollapsed={false} activeCount={0} alertCount={0} />,
    );

    expect(screen.getAllByText("0")).toHaveLength(2);
  });

  it("renders zero active count correctly in collapsed mode", () => {
    render(<SidebarInsights isCollapsed activeCount={0} alertCount={0} />);

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders the alert count independently from active count", () => {
    render(
      <SidebarInsights isCollapsed={false} activeCount={150} alertCount={1} />,
    );

    expect(screen.getByText("150")).toBeInTheDocument();

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders only one summary value in collapsed mode", () => {
    render(<SidebarInsights isCollapsed activeCount={124} alertCount={8} />);

    expect(screen.getByText("99+")).toBeInTheDocument();

    expect(screen.queryByText("8")).not.toBeInTheDocument();
  });

  it("switches from expanded to collapsed presentation based on isCollapsed", () => {
    const { rerender } = render(
      <SidebarInsights isCollapsed={false} activeCount={24} alertCount={6} />,
    );

    expect(screen.getByText("Active")).toBeInTheDocument();

    expect(screen.getByText("Alerts")).toBeInTheDocument();

    rerender(<SidebarInsights isCollapsed activeCount={24} alertCount={6} />);

    expect(screen.queryByText("Active")).not.toBeInTheDocument();

    expect(screen.queryByText("Alerts")).not.toBeInTheDocument();

    expect(screen.getByText("24")).toBeInTheDocument();
  });
});
