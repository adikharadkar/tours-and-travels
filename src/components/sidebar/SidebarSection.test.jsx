import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import SidebarSection from "./SidebarSection";

describe("SidebarSection", () => {
  it("renders the section title when expanded", () => {
    render(
      <SidebarSection title="Operations" isCollapsed={false}>
        <div>Trips</div>
      </SidebarSection>,
    );

    expect(
      screen.getByRole("heading", {
        name: "Operations",
      }),
    ).toBeInTheDocument();
  });

  it("renders children when expanded", () => {
    render(
      <SidebarSection title="Operations" isCollapsed={false}>
        <div>Trips</div>
        <div>Calendar</div>
      </SidebarSection>,
    );

    expect(screen.getByText("Trips")).toBeInTheDocument();

    expect(screen.getByText("Calendar")).toBeInTheDocument();
  });

  it("does not render the section title when collapsed", () => {
    render(
      <SidebarSection title="Operations" isCollapsed>
        <div>Trips</div>
      </SidebarSection>,
    );

    expect(
      screen.queryByRole("heading", {
        name: "Operations",
      }),
    ).not.toBeInTheDocument();
  });

  it("still renders children when collapsed", () => {
    render(
      <SidebarSection title="Operations" isCollapsed>
        <div>Trips</div>
        <div>Calendar</div>
      </SidebarSection>,
    );

    expect(screen.getByText("Trips")).toBeInTheDocument();

    expect(screen.getByText("Calendar")).toBeInTheDocument();
  });

  it("renders a separator when collapsed", () => {
    const { container } = render(
      <SidebarSection title="Operations" isCollapsed>
        <div>Trips</div>
      </SidebarSection>,
    );

    const separator = container.querySelector(".h-px");

    expect(separator).toBeInTheDocument();
  });

  it("does not render the collapsed separator when expanded", () => {
    const { container } = render(
      <SidebarSection title="Operations" isCollapsed={false}>
        <div>Trips</div>
      </SidebarSection>,
    );

    expect(container.querySelector(".h-px")).not.toBeInTheDocument();
  });

  it("renders multiple children in the correct order", () => {
    render(
      <SidebarSection title="Masters" isCollapsed={false}>
        <div>Customers</div>
        <div>Vehicles</div>
        <div>Drivers</div>
      </SidebarSection>,
    );

    const customers = screen.getByText("Customers");

    const vehicles = screen.getByText("Vehicles");

    const drivers = screen.getByText("Drivers");

    expect(
      customers.compareDocumentPosition(vehicles) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    expect(
      vehicles.compareDocumentPosition(drivers) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("renders without children", () => {
    render(<SidebarSection title="Settings" isCollapsed={false} />);

    expect(
      screen.getByRole("heading", {
        name: "Settings",
      }),
    ).toBeInTheDocument();
  });

  it("renders the provided title exactly", () => {
    render(
      <SidebarSection title="Fleet Management" isCollapsed={false}>
        <div>Vehicles</div>
      </SidebarSection>,
    );

    expect(
      screen.getByRole("heading", {
        name: "Fleet Management",
      }),
    ).toBeInTheDocument();
  });
});
