import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import SidebarNavItem from "./SidebarNavItem";

const renderNavItem = (props = {}, initialEntries = ["/"]) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <SidebarNavItem
        name="Customers"
        path="/customers"
        icon="group"
        {...props}
      />
    </MemoryRouter>,
  );
};

describe("SidebarNavItem", () => {
  it("renders the navigation item name", () => {
    renderNavItem();

    expect(screen.getByText("Customers")).toBeInTheDocument();
  });

  it("renders the icon", () => {
    renderNavItem();

    expect(screen.getByText("group")).toBeInTheDocument();
  });

  it("renders the navigation link with the correct path", () => {
    renderNavItem();

    const link = screen.getByRole("link", {
      name: /Customers/,
    });

    expect(link).toHaveAttribute("href", "/customers");
  });

  it("renders the navigation item in expanded mode by default", () => {
    renderNavItem();

    expect(screen.getByText("Customers")).toBeInTheDocument();
  });

  it("hides the label when collapsed", () => {
    renderNavItem({
      isCollapsed: true,
    });

    expect(screen.queryByText("Customers")).not.toBeInTheDocument();

    expect(screen.getByText("group")).toBeInTheDocument();
  });

  it("adds the item name as a title when collapsed", () => {
    renderNavItem({
      isCollapsed: true,
    });

    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("title", "Customers");
  });

  it("does not add a title when expanded", () => {
    renderNavItem({
      isCollapsed: false,
    });

    const link = screen.getByRole("link");

    expect(link).not.toHaveAttribute("title");
  });

  it("renders a badge when badge is provided", () => {
    renderNavItem({
      badge: 5,
    });

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders a string badge", () => {
    renderNavItem({
      badge: "New",
    });

    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("does not render a badge when badge is undefined", () => {
    renderNavItem({
      badge: undefined,
    });

    expect(screen.queryByText("5")).not.toBeInTheDocument();
  });

  it("does not render a badge when badge is null", () => {
    renderNavItem({
      badge: null,
    });

    expect(screen.queryByText("5")).not.toBeInTheDocument();
  });

  it("renders a badge in expanded mode", () => {
    renderNavItem({
      badge: 3,
      isCollapsed: false,
    });

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("hides the badge text in collapsed mode", () => {
    renderNavItem({
      badge: 3,
      isCollapsed: true,
    });

    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });

  it("renders a floating badge indicator in collapsed mode", () => {
    const { container } = renderNavItem({
      badge: 3,
      isCollapsed: true,
    });

    const floatingBadge = container.querySelector(
      ".absolute.top-1\\.5.right-1\\.5",
    );

    expect(floatingBadge).toBeInTheDocument();
  });

  it("does not render the floating badge indicator when no badge exists", () => {
    const { container } = renderNavItem({
      badge: null,
      isCollapsed: true,
    });

    const floatingBadge = container.querySelector(
      ".absolute.top-1\\.5.right-1\\.5",
    );

    expect(floatingBadge).not.toBeInTheDocument();
  });

  it("renders the cyan badge", () => {
    const { container } = renderNavItem({
      badge: 3,
      badgeType: "cyan",
    });

    const badge = container.querySelector(".rounded-full");

    expect(badge).toBeInTheDocument();

    expect(badge).toHaveTextContent("3");
  });

  it("renders the secondary badge using the same badge treatment as cyan", () => {
    const { container } = renderNavItem({
      badge: 3,
      badgeType: "secondary",
    });

    const badge = container.querySelector(".rounded-full");

    expect(badge).toBeInTheDocument();

    expect(badge).toHaveTextContent("3");
  });

  it("renders the amber badge", () => {
    const { container } = renderNavItem({
      badge: 7,
      badgeType: "amber",
    });

    const badge = container.querySelector(".rounded-full");

    expect(badge).toBeInTheDocument();

    expect(badge).toHaveTextContent("7");
  });

  it("renders the warning badge using the amber treatment", () => {
    const { container } = renderNavItem({
      badge: 7,
      badgeType: "warning",
    });

    const badge = container.querySelector(".rounded-full");

    expect(badge).toBeInTheDocument();

    expect(badge).toHaveTextContent("7");
  });

  it("renders the primary badge by default", () => {
    const { container } = renderNavItem({
      badge: 9,
    });

    const badge = container.querySelector(".rounded-full");

    expect(badge).toBeInTheDocument();

    expect(badge).toHaveTextContent("9");
  });

  it("marks the link as active when the current route matches", () => {
    renderNavItem(
      {
        path: "/customers",
      },
      ["/customers"],
    );

    const link = screen.getByRole("link", {
      name: /Customers/,
    });

    expect(link).toHaveAttribute("aria-current", "page");

    expect(link.className).toContain("bg-[#8455ef]");
  });

  it("marks the link as inactive when the current route does not match", () => {
    renderNavItem(
      {
        path: "/customers",
      },
      ["/dashboard"],
    );

    const link = screen.getByRole("link", {
      name: /Customers/,
    });

    expect(link).not.toHaveAttribute("aria-current", "page");

    expect(link.className).toContain("border-transparent");
  });

  it("supports exact matching through isExact", () => {
    renderNavItem(
      {
        path: "/customers",
        isExact: true,
      },
      ["/customers/123"],
    );

    const link = screen.getByRole("link", {
      name: /Customers/,
    });

    expect(link).not.toHaveAttribute("aria-current", "page");
  });

  it("allows non-exact matching by default", () => {
    renderNavItem(
      {
        path: "/customers",
        isExact: false,
      },
      ["/customers/123"],
    );

    const link = screen.getByRole("link", {
      name: /Customers/,
    });

    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();

    renderNavItem({
      onClick,
    });

    fireEvent.click(
      screen.getByRole("link", {
        name: /Customers/,
      }),
    );

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("passes the click event to onClick", () => {
    const onClick = vi.fn();

    renderNavItem({
      onClick,
    });

    fireEvent.click(
      screen.getByRole("link", {
        name: /Customers/,
      }),
    );

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders a different navigation item correctly", () => {
    renderNavItem({
      name: "Invoices",
      path: "/invoices",
      icon: "receipt_long",
      badge: 2,
    });

    expect(screen.getByText("Invoices")).toBeInTheDocument();

    expect(screen.getByText("receipt_long")).toBeInTheDocument();

    expect(screen.getByText("2")).toBeInTheDocument();

    expect(screen.getByRole("link")).toHaveAttribute("href", "/invoices");
  });
});
