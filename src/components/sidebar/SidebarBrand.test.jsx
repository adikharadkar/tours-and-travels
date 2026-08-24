import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import SidebarBrand from "./SidebarBrand";

const renderSidebarBrand = (props = {}) => {
  return render(
    <MemoryRouter>
      <SidebarBrand {...props} />
    </MemoryRouter>,
  );
};

describe("SidebarBrand", () => {
  it("renders FleetCore branding in expanded mode", () => {
    renderSidebarBrand({
      isCollapsed: false,
    });

    expect(screen.getByText("FleetCore")).toBeInTheDocument();

    expect(screen.getByText("OPERATIONAL CENTER")).toBeInTheDocument();
  });

  it("hides the brand text when collapsed", () => {
    renderSidebarBrand({
      isCollapsed: true,
    });

    expect(screen.queryByText("FleetCore")).not.toBeInTheDocument();

    expect(screen.queryByText("OPERATIONAL CENTER")).not.toBeInTheDocument();
  });

  it("always renders the shipping icon", () => {
    renderSidebarBrand({
      isCollapsed: false,
    });

    expect(screen.getByText("local_shipping")).toBeInTheDocument();
  });

  it("renders the brand link pointing to the dashboard", () => {
    renderSidebarBrand({
      isCollapsed: false,
    });

    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("href", "/dashboard");

    expect(link).toHaveAttribute("title", "FleetCore Operational Center");
  });

  it("renders the brand link when collapsed", () => {
    renderSidebarBrand({
      isCollapsed: true,
    });

    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("href", "/dashboard");

    expect(link).toHaveAttribute("title", "FleetCore Operational Center");
  });

  it("renders the collapse button when onToggleCollapse is provided", () => {
    const onToggleCollapse = vi.fn();

    renderSidebarBrand({
      isCollapsed: false,
      onToggleCollapse,
    });

    expect(
      screen.getByRole("button", {
        name: "Collapse sidebar",
      }),
    ).toBeInTheDocument();
  });

  it("does not render the collapse button when callback is missing", () => {
    renderSidebarBrand({
      isCollapsed: false,
    });

    expect(
      screen.queryByRole("button", {
        name: "Collapse sidebar",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders Expand sidebar when collapsed", () => {
    const onToggleCollapse = vi.fn();

    renderSidebarBrand({
      isCollapsed: true,
      onToggleCollapse,
    });

    expect(
      screen.getByRole("button", {
        name: "Expand sidebar",
      }),
    ).toBeInTheDocument();
  });

  it("calls onToggleCollapse when collapse button is clicked", () => {
    const onToggleCollapse = vi.fn();

    renderSidebarBrand({
      isCollapsed: false,
      onToggleCollapse,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Collapse sidebar",
      }),
    );

    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it("calls onToggleCollapse when expand button is clicked", () => {
    const onToggleCollapse = vi.fn();

    renderSidebarBrand({
      isCollapsed: true,
      onToggleCollapse,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Expand sidebar",
      }),
    );

    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it("sets the correct title for the collapse button", () => {
    const onToggleCollapse = vi.fn();

    renderSidebarBrand({
      isCollapsed: false,
      onToggleCollapse,
    });

    expect(
      screen.getByRole("button", {
        name: "Collapse sidebar",
      }),
    ).toHaveAttribute("title", "Collapse sidebar");
  });

  it("sets the correct title for the expand button", () => {
    const onToggleCollapse = vi.fn();

    renderSidebarBrand({
      isCollapsed: true,
      onToggleCollapse,
    });

    expect(
      screen.getByRole("button", {
        name: "Expand sidebar",
      }),
    ).toHaveAttribute("title", "Expand sidebar");
  });

  it("renders the mobile close button when onCloseMobile is provided", () => {
    const onCloseMobile = vi.fn();

    renderSidebarBrand({
      isCollapsed: false,
      onCloseMobile,
    });

    expect(
      screen.getByRole("button", {
        name: "Close navigation",
      }),
    ).toBeInTheDocument();
  });

  it("does not render the mobile close button when callback is missing", () => {
    renderSidebarBrand({
      isCollapsed: false,
    });

    expect(
      screen.queryByRole("button", {
        name: "Close navigation",
      }),
    ).not.toBeInTheDocument();
  });

  it("calls onCloseMobile when the close button is clicked", () => {
    const onCloseMobile = vi.fn();

    renderSidebarBrand({
      isCollapsed: false,
      onCloseMobile,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close navigation",
      }),
    );

    expect(onCloseMobile).toHaveBeenCalledTimes(1);
  });

  it("renders both action buttons when both callbacks are provided", () => {
    const onToggleCollapse = vi.fn();

    const onCloseMobile = vi.fn();

    renderSidebarBrand({
      isCollapsed: false,
      onToggleCollapse,
      onCloseMobile,
    });

    expect(
      screen.getByRole("button", {
        name: "Collapse sidebar",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Close navigation",
      }),
    ).toBeInTheDocument();
  });

  it("renders the correct icon for collapsed state", () => {
    const onToggleCollapse = vi.fn();

    renderSidebarBrand({
      isCollapsed: true,
      onToggleCollapse,
    });

    expect(screen.getByText("last_page")).toBeInTheDocument();
  });

  it("renders the correct icon for expanded state", () => {
    const onToggleCollapse = vi.fn();

    renderSidebarBrand({
      isCollapsed: false,
      onToggleCollapse,
    });

    expect(screen.getByText("first_page")).toBeInTheDocument();
  });
});
