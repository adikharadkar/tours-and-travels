import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import HeaderContext from "./HeaderContext";

const renderHeaderContext = (props = {}) => {
  return render(
    <MemoryRouter>
      <HeaderContext {...props} />
    </MemoryRouter>,
  );
};

describe("HeaderContext", () => {
  it("renders the page title", () => {
    renderHeaderContext({
      title: "Customers",
    });

    expect(
      screen.getByRole("heading", {
        name: "Customers",
      }),
    ).toBeInTheDocument();
  });

  it("renders a title with no breadcrumbs", () => {
    renderHeaderContext({
      title: "Dashboard",
    });

    expect(
      screen.getByRole("heading", {
        name: "Dashboard",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("navigation", {
        name: "Breadcrumbs",
      }),
    ).not.toBeInTheDocument();
  });

  it("does not render breadcrumbs when breadcrumbs is an empty array", () => {
    renderHeaderContext({
      title: "Vehicles",
      breadcrumbs: [],
    });

    expect(
      screen.queryByRole("navigation", {
        name: "Breadcrumbs",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders the breadcrumb navigation when breadcrumbs are provided", () => {
    renderHeaderContext({
      title: "Customers",
      breadcrumbs: [
        {
          label: "Masters",
        },
        {
          label: "Customers",
        },
      ],
    });

    expect(
      screen.getByRole("navigation", {
        name: "Breadcrumbs",
      }),
    ).toBeInTheDocument();
  });

  it("renders all breadcrumb labels", () => {
    renderHeaderContext({
      title: "Customers",
      breadcrumbs: [
        {
          label: "Masters",
        },
        {
          label: "Customers",
        },
      ],
    });

    expect(screen.getByText("Masters")).toBeInTheDocument();

    expect(screen.getAllByText("Customers").length).toBeGreaterThan(0);
  });

  it("renders the last breadcrumb as non-clickable text", () => {
    renderHeaderContext({
      title: "Customers",
      breadcrumbs: [
        {
          label: "Masters",
          path: "/masters",
        },
        {
          label: "Customers",
          path: "/customers",
        },
      ],
    });

    const breadcrumbNav = screen.getByRole("navigation", {
      name: "Breadcrumbs",
    });

    const lastBreadcrumb = within(breadcrumbNav).getByText("Customers");

    expect(lastBreadcrumb.tagName).toBe("SPAN");

    expect(
      screen.queryByRole("link", {
        name: "Customers",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders an intermediate breadcrumb as a link when it has a path", () => {
    renderHeaderContext({
      title: "Customers",
      breadcrumbs: [
        {
          label: "Masters",
          path: "/masters",
        },
        {
          label: "Customers",
        },
      ],
    });

    const mastersLink = screen.getByRole("link", {
      name: "Masters",
    });

    expect(mastersLink).toHaveAttribute("href", "/masters");
  });

  it("renders the last breadcrumb as text even when it has a path", () => {
    renderHeaderContext({
      title: "Customers",
      breadcrumbs: [
        {
          label: "Masters",
          path: "/masters",
        },
        {
          label: "Customers",
          path: "/customers",
        },
      ],
    });

    expect(
      screen.queryByRole("link", {
        name: "Customers",
      }),
    ).not.toBeInTheDocument();

    expect(screen.getAllByText("Customers").length).toBeGreaterThan(0);
  });

  it("renders an intermediate breadcrumb without a link when it has no path", () => {
    renderHeaderContext({
      title: "Customer Details",
      breadcrumbs: [
        {
          label: "Customers",
        },
        {
          label: "Perkins India",
        },
      ],
    });

    expect(
      screen.queryByRole("link", {
        name: "Customers",
      }),
    ).not.toBeInTheDocument();

    expect(screen.getByText("Customers")).toBeInTheDocument();
  });

  it("renders chevron separators between breadcrumbs", () => {
    renderHeaderContext({
      title: "Customer Details",
      breadcrumbs: [
        {
          label: "Masters",
          path: "/masters",
        },
        {
          label: "Customers",
          path: "/customers",
        },
        {
          label: "Perkins India",
        },
      ],
    });

    expect(screen.getAllByText("chevron_right")).toHaveLength(2);
  });

  it("does not render a separator after the last breadcrumb", () => {
    renderHeaderContext({
      title: "Customers",
      breadcrumbs: [
        {
          label: "Masters",
        },
        {
          label: "Customers",
        },
      ],
    });

    expect(screen.getAllByText("chevron_right")).toHaveLength(1);
  });

  it("renders a complete breadcrumb trail correctly", () => {
    renderHeaderContext({
      title: "Edit Customer",
      breadcrumbs: [
        {
          label: "Masters",
          path: "/masters",
        },
        {
          label: "Customers",
          path: "/customers",
        },
        {
          label: "Edit Customer",
        },
      ],
    });

    expect(
      screen.getByRole("link", {
        name: "Masters",
      }),
    ).toHaveAttribute("href", "/masters");

    expect(
      screen.getByRole("link", {
        name: "Customers",
      }),
    ).toHaveAttribute("href", "/customers");

    expect(screen.getAllByText("Edit Customer").length).toBeGreaterThan(0);

    expect(screen.getAllByText("chevron_right")).toHaveLength(2);

    expect(
      screen.getByRole("heading", {
        name: "Edit Customer",
      }),
    ).toBeInTheDocument();
  });

  it("supports a single breadcrumb", () => {
    renderHeaderContext({
      title: "Customers",
      breadcrumbs: [
        {
          label: "Customers",
          path: "/customers",
        },
      ],
    });

    expect(
      screen.getByRole("navigation", {
        name: "Breadcrumbs",
      }),
    ).toBeInTheDocument();

    expect(screen.getAllByText("Customers").length).toBeGreaterThan(0);

    expect(screen.queryAllByText("chevron_right")).toHaveLength(0);

    expect(
      screen.queryByRole("link", {
        name: "Customers",
      }),
    ).not.toBeInTheDocument();
  });

  it("handles multiple breadcrumb levels", () => {
    renderHeaderContext({
      title: "Edit Invoice",
      breadcrumbs: [
        {
          label: "Finance",
          path: "/finance",
        },
        {
          label: "Invoices",
          path: "/invoices",
        },
        {
          label: "INV-0001",
          path: "/invoices/1",
        },
        {
          label: "Edit Invoice",
        },
      ],
    });

    expect(
      screen.getByRole("link", {
        name: "Finance",
      }),
    ).toHaveAttribute("href", "/finance");

    expect(
      screen.getByRole("link", {
        name: "Invoices",
      }),
    ).toHaveAttribute("href", "/invoices");

    expect(
      screen.getByRole("link", {
        name: "INV-0001",
      }),
    ).toHaveAttribute("href", "/invoices/1");

    expect(screen.getAllByText("Edit Invoice").length).toBeGreaterThan(0);

    expect(screen.getAllByText("chevron_right")).toHaveLength(3);
  });

  it("renders the title exactly as provided", () => {
    renderHeaderContext({
      title: "Trips / Bookings",
    });

    expect(
      screen.getByRole("heading", {
        name: "Trips / Bookings",
      }),
    ).toBeInTheDocument();
  });

  it("renders an empty title when none is provided", () => {
    renderHeaderContext({
      breadcrumbs: [
        {
          label: "Dashboard",
        },
      ],
    });

    expect(screen.getByRole("heading")).toHaveTextContent("");
  });

  it("renders an empty breadcrumb label without crashing", () => {
    renderHeaderContext({
      title: "Dashboard",
      breadcrumbs: [
        {
          label: "",
        },
      ],
    });

    expect(
      screen.getByRole("navigation", {
        name: "Breadcrumbs",
      }),
    ).toBeInTheDocument();
  });
});
