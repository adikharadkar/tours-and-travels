import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import HeaderSearch from "./HeaderSearch";

import { executeGlobalSearch } from "../../services/globalSearchService";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../services/globalSearchService", () => ({
  executeGlobalSearch: vi.fn(),
}));

const searchResults = {
  customers: [
    {
      id: "customer-1",
      category: "customer",
      title: "Perkins India",
      subtitle: "CUS-0001 · 9876543210",
      icon: "group",
      link: "/customers/customer-1",
    },
  ],

  vehicles: [
    {
      id: "vehicle-1",
      category: "vehicle",
      title: "MH20AB1234",
      subtitle: "VEH-0001 · Tata Starbus",
      icon: "directions_car",
      link: "/vehicles/vehicle-1",
    },
  ],

  drivers: [
    {
      id: "driver-1",
      category: "driver",
      title: "Rajesh Patil",
      subtitle: "DRV-0001 · 9876543210",
      icon: "badge",
      link: "/drivers/driver-1",
    },
  ],

  trips: [
    {
      id: "trip-1",
      category: "trip",
      title: "TRP-0001",
      subtitle: "Perkins India · Pune",
      icon: "route",
      link: "/trips/trip-1",
    },
  ],

  totalMatches: 4,
};

const emptyResults = {
  customers: [],
  vehicles: [],
  drivers: [],
  trips: [],
  totalMatches: 0,
};

const renderHeaderSearch = () => {
  return render(
    <MemoryRouter>
      <HeaderSearch />
    </MemoryRouter>,
  );
};

describe("HeaderSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    executeGlobalSearch.mockReturnValue(searchResults);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the desktop search input", () => {
    renderHeaderSearch();

    expect(
      screen.getByPlaceholderText("Search FleetCore..."),
    ).toBeInTheDocument();
  });

  it("renders the keyboard shortcut hint", () => {
    renderHeaderSearch();

    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("does not execute a search for an empty query", () => {
    renderHeaderSearch();

    expect(executeGlobalSearch).not.toHaveBeenCalled();
  });

  it("executes global search when a query is entered", async () => {
    renderHeaderSearch();

    const input = screen.getByPlaceholderText("Search FleetCore...");

    fireEvent.change(input, {
      target: {
        value: "Perkins",
      },
    });

    await waitFor(() => {
      expect(executeGlobalSearch).toHaveBeenCalledWith("Perkins");
    });
  });

  it("opens the results dropdown when a query has results", async () => {
    renderHeaderSearch();

    fireEvent.change(screen.getByPlaceholderText("Search FleetCore..."), {
      target: {
        value: "Perkins",
      },
    });

    expect(await screen.findByText("Customers (1)")).toBeInTheDocument();

    const resultText = await screen.findByText("Perkins India");

    const resultButton = resultText.closest("button");

    expect(resultButton).toBeTruthy();
  });

  it("renders customer results", async () => {
    renderHeaderSearch();

    fireEvent.change(screen.getByPlaceholderText("Search FleetCore..."), {
      target: {
        value: "Perkins",
      },
    });

    expect(await screen.findByText("Perkins India")).toBeInTheDocument();

    expect(screen.getByText("Customers (1)")).toBeInTheDocument();

    expect(screen.getByText("CUS-0001 · 9876543210")).toBeInTheDocument();
  });

  it("renders vehicle results", async () => {
    renderHeaderSearch();

    fireEvent.change(screen.getByPlaceholderText("Search FleetCore..."), {
      target: {
        value: "MH20AB1234",
      },
    });

    expect(await screen.findByText("MH20AB1234")).toBeInTheDocument();

    expect(screen.getByText("Vehicles (1)")).toBeInTheDocument();

    expect(screen.getByText("VEH-0001 · Tata Starbus")).toBeInTheDocument();
  });

  it("renders driver results", async () => {
    renderHeaderSearch();

    fireEvent.change(screen.getByPlaceholderText("Search FleetCore..."), {
      target: {
        value: "Rajesh",
      },
    });

    expect(await screen.findByText("Rajesh Patil")).toBeInTheDocument();

    expect(screen.getByText("Drivers (1)")).toBeInTheDocument();

    expect(screen.getByText("DRV-0001 · 9876543210")).toBeInTheDocument();
  });

  it("renders trip results", async () => {
    renderHeaderSearch();

    fireEvent.change(screen.getByPlaceholderText("Search FleetCore..."), {
      target: {
        value: "TRP-0001",
      },
    });

    expect(await screen.findByText("TRP-0001")).toBeInTheDocument();

    expect(screen.getByText("Trips (1)")).toBeInTheDocument();

    expect(screen.getByText("Perkins India · Pune")).toBeInTheDocument();
  });

  it("renders all result categories together", async () => {
    renderHeaderSearch();

    fireEvent.change(screen.getByPlaceholderText("Search FleetCore..."), {
      target: {
        value: "fleet",
      },
    });

    expect(await screen.findByText("Customers (1)")).toBeInTheDocument();

    expect(screen.getByText("Vehicles (1)")).toBeInTheDocument();

    expect(screen.getByText("Drivers (1)")).toBeInTheDocument();

    expect(screen.getByText("Trips (1)")).toBeInTheDocument();
  });

  it("renders no-results state when search returns no matches", async () => {
    executeGlobalSearch.mockReturnValue(emptyResults);

    renderHeaderSearch();

    fireEvent.change(screen.getByPlaceholderText("Search FleetCore..."), {
      target: {
        value: "unknown",
      },
    });

    expect(
      await screen.findByText('No matching records found for "unknown"'),
    ).toBeInTheDocument();
  });

  it("does not show the results dropdown when query is empty", async () => {
    renderHeaderSearch();

    const input = screen.getByPlaceholderText("Search FleetCore...");

    fireEvent.change(input, {
      target: {
        value: "Perkins",
      },
    });

    expect(await screen.findByText("Customers (1)")).toBeInTheDocument();

    fireEvent.change(input, {
      target: {
        value: "",
      },
    });

    await waitFor(() => {
      expect(screen.queryByText("Customers (1)")).not.toBeInTheDocument();
    });
  });

  it("does not execute search for whitespace-only input", async () => {
    renderHeaderSearch();

    fireEvent.change(screen.getByPlaceholderText("Search FleetCore..."), {
      target: {
        value: "   ",
      },
    });

    expect(executeGlobalSearch).not.toHaveBeenCalled();
  });

  it("reopens results on input focus when a query exists", async () => {
    renderHeaderSearch();

    const input = screen.getByPlaceholderText("Search FleetCore...");

    fireEvent.change(input, {
      target: {
        value: "Perkins",
      },
    });

    expect(await screen.findByText("Customers (1)")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText("Customers (1)")).not.toBeInTheDocument();
    });

    fireEvent.focus(input);

    expect(screen.getByText("Customers (1)")).toBeInTheDocument();
  });

  it("navigates when a desktop search result is selected", async () => {
    renderHeaderSearch();

    fireEvent.change(screen.getByPlaceholderText("Search FleetCore..."), {
      target: {
        value: "Perkins",
      },
    });

    const resultText = await screen.findByText("Perkins India");

    const resultButton = resultText.closest("button");

    expect(resultButton).toBeTruthy();

    fireEvent.click(resultButton);

    expect(navigateMock).toHaveBeenCalledTimes(1);

    expect(navigateMock).toHaveBeenCalledWith("/customers/customer-1");
  });

  it("closes results after a result is selected", async () => {
    renderHeaderSearch();

    fireEvent.change(screen.getByPlaceholderText("Search FleetCore..."), {
      target: {
        value: "Perkins",
      },
    });

    const resultText = await screen.findByText("Perkins India");

    const resultButton = resultText.closest("button");

    expect(resultButton).toBeTruthy();

    fireEvent.click(resultButton);

    expect(screen.queryByText("Customers (1)")).not.toBeInTheDocument();
  });

  it("clears the query after a result is selected", async () => {
    renderHeaderSearch();

    const input = screen.getByPlaceholderText("Search FleetCore...");

    fireEvent.change(input, {
      target: {
        value: "Perkins",
      },
    });

    const resultText = await screen.findByText("Perkins India");

    const resultButton = resultText.closest("button");

    expect(resultButton).toBeTruthy();

    fireEvent.click(resultButton);

    expect(input).toHaveValue("");
  });

  it("closes desktop results when Escape is pressed", async () => {
    renderHeaderSearch();

    fireEvent.change(screen.getByPlaceholderText("Search FleetCore..."), {
      target: {
        value: "Perkins",
      },
    });

    expect(await screen.findByText("Customers (1)")).toBeInTheDocument();

    fireEvent.keyDown(document, {
      key: "Escape",
    });

    expect(screen.queryByText("Customers (1)")).not.toBeInTheDocument();
  });

  it("closes desktop results when clicking outside", async () => {
    renderHeaderSearch();

    fireEvent.change(screen.getByPlaceholderText("Search FleetCore..."), {
      target: {
        value: "Perkins",
      },
    });

    expect(await screen.findByText("Customers (1)")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText("Customers (1)")).not.toBeInTheDocument();
  });

  it("does not close results when clicking inside the search container", async () => {
    renderHeaderSearch();

    const input = screen.getByPlaceholderText("Search FleetCore...");

    fireEvent.change(input, {
      target: {
        value: "Perkins",
      },
    });

    expect(await screen.findByText("Customers (1)")).toBeInTheDocument();

    fireEvent.mouseDown(input);

    expect(screen.getByText("Customers (1)")).toBeInTheDocument();
  });

  it("opens desktop search with Ctrl+K", () => {
    renderHeaderSearch();

    const input = screen.getByPlaceholderText("Search FleetCore...");

    fireEvent.keyDown(window, {
      key: "k",
      ctrlKey: true,
    });

    expect(input).toHaveFocus();
  });

  it("opens desktop search with Meta+K", () => {
    renderHeaderSearch();

    const input = screen.getByPlaceholderText("Search FleetCore...");

    fireEvent.keyDown(window, {
      key: "k",
      metaKey: true,
    });

    expect(input).toHaveFocus();
  });

  it("ignores plain K presses", () => {
    renderHeaderSearch();

    const input = screen.getByPlaceholderText("Search FleetCore...");

    fireEvent.keyDown(window, {
      key: "k",
    });

    expect(input).not.toHaveFocus();
  });

  it("renders the mobile search trigger", () => {
    renderHeaderSearch();

    expect(
      screen.getByRole("button", {
        name: "Search FleetCore",
      }),
    ).toBeInTheDocument();
  });

  it("opens the mobile search overlay from the search button", () => {
    renderHeaderSearch();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Search FleetCore",
      }),
    );

    expect(screen.getAllByPlaceholderText("Search FleetCore...")).toHaveLength(
      2,
    );
  });

  it("renders a close button inside mobile search", () => {
    renderHeaderSearch();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Search FleetCore",
      }),
    );

    const closeIcon = screen.getByText("close");

    expect(closeIcon.closest("button")).toBeInTheDocument();
  });

  it("closes mobile search when close is clicked", () => {
    renderHeaderSearch();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Search FleetCore",
      }),
    );

    const closeIcon = screen.getByText("close");
    const closeButton = closeIcon.closest("button");

    expect(closeButton).toBeTruthy();

    fireEvent.click(closeButton);

    expect(screen.getAllByPlaceholderText("Search FleetCore...")).toHaveLength(
      1,
    );
  });

  it("renders mobile search results after entering a query", async () => {
    renderHeaderSearch();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Search FleetCore",
      }),
    );

    const inputs = screen.getAllByPlaceholderText("Search FleetCore...");

    const mobileInput = inputs[inputs.length - 1];

    fireEvent.change(mobileInput, {
      target: {
        value: "Perkins",
      },
    });

    expect(await screen.findAllByText("Perkins India")).not.toHaveLength(0);
  });

  it("renders the mobile no-results state", async () => {
    executeGlobalSearch.mockReturnValue(emptyResults);

    renderHeaderSearch();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Search FleetCore",
      }),
    );

    const inputs = screen.getAllByPlaceholderText("Search FleetCore...");

    const mobileInput = inputs[inputs.length - 1];

    fireEvent.change(mobileInput, {
      target: {
        value: "unknown",
      },
    });

    expect(await screen.findByText("No matches found")).toBeInTheDocument();
  });

  it("navigates from a mobile search result", async () => {
    renderHeaderSearch();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Search FleetCore",
      }),
    );

    const inputs = screen.getAllByPlaceholderText("Search FleetCore...");

    const mobileInput = inputs[inputs.length - 1];

    fireEvent.change(mobileInput, {
      target: {
        value: "Perkins",
      },
    });

    const matchingResults = await screen.findAllByText("Perkins India");

    fireEvent.click(matchingResults[matchingResults.length - 1]);

    expect(navigateMock).toHaveBeenCalledWith("/customers/customer-1");
  });

  it("closes mobile search when Escape is pressed", () => {
    renderHeaderSearch();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Search FleetCore",
      }),
    );

    fireEvent.keyDown(window, {
      key: "Escape",
    });

    expect(screen.getAllByPlaceholderText("Search FleetCore...")).toHaveLength(
      1,
    );
  });

  it("opens mobile search with Ctrl+K when viewport is mobile", () => {
    const originalInnerWidth = window.innerWidth;

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 500,
    });

    try {
      renderHeaderSearch();

      fireEvent.keyDown(window, {
        key: "k",
        ctrlKey: true,
      });

      expect(
        screen.getAllByPlaceholderText("Search FleetCore..."),
      ).toHaveLength(2);
    } finally {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: originalInnerWidth,
      });
    }
  });

  it("opens mobile search with Meta+K when viewport is mobile", () => {
    const originalInnerWidth = window.innerWidth;

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 500,
    });

    try {
      renderHeaderSearch();

      fireEvent.keyDown(window, {
        key: "k",
        metaKey: true,
      });

      expect(
        screen.getAllByPlaceholderText("Search FleetCore..."),
      ).toHaveLength(2);
    } finally {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: originalInnerWidth,
      });
    }
  });

  it("uses the result icon when rendering desktop results", async () => {
    renderHeaderSearch();

    fireEvent.change(screen.getByPlaceholderText("Search FleetCore..."), {
      target: {
        value: "Perkins",
      },
    });

    expect(await screen.findByText("group")).toBeInTheDocument();
  });

  it("handles search results with multiple records in the same category", async () => {
    executeGlobalSearch.mockReturnValue({
      ...searchResults,
      customers: [
        ...searchResults.customers,
        {
          id: "customer-2",
          category: "customer",
          title: "ABC Travels",
          subtitle: "CUS-0002 · 9999999999",
          icon: "group",
          link: "/customers/customer-2",
        },
      ],
      totalMatches: 5,
    });

    renderHeaderSearch();

    fireEvent.change(screen.getByPlaceholderText("Search FleetCore..."), {
      target: {
        value: "customer",
      },
    });

    expect(await screen.findByText("Customers (2)")).toBeInTheDocument();

    expect(screen.getByText("Perkins India")).toBeInTheDocument();

    expect(screen.getByText("ABC Travels")).toBeInTheDocument();
  });
});
