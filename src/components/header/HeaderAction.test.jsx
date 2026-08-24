import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import HeaderAction from "./HeaderAction";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const renderHeaderAction = (action) => {
  return render(
    <MemoryRouter>
      <HeaderAction action={action} />
    </MemoryRouter>,
  );
};

describe("HeaderAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when action is missing", () => {
    const { container } = renderHeaderAction(null);

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when action is undefined", () => {
    const { container } = renderHeaderAction(undefined);

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when action has no label", () => {
    const { container } = renderHeaderAction({
      path: "/customers/new",
    });

    expect(container.firstChild).toBeNull();
  });

  it("renders the action label", () => {
    renderHeaderAction({
      label: "New Customer",
    });

    expect(
      screen.getByRole("button", {
        name: "New Customer",
      }),
    ).toBeInTheDocument();
  });

  it("renders the default add icon when icon is not provided", () => {
    renderHeaderAction({
      label: "New Customer",
    });

    expect(screen.getByText("add")).toBeInTheDocument();
  });

  it("renders the provided icon", () => {
    renderHeaderAction({
      label: "New Vehicle",
      icon: "directions_car",
    });

    expect(screen.getByText("directions_car")).toBeInTheDocument();
  });

  it("renders the icon as aria-hidden", () => {
    renderHeaderAction({
      label: "New Driver",
      icon: "badge",
    });

    const icon = screen.getByText("badge");

    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("renders a button with type button", () => {
    renderHeaderAction({
      label: "New Customer",
    });

    expect(
      screen.getByRole("button", {
        name: "New Customer",
      }),
    ).toHaveAttribute("type", "button");
  });

  it("calls action.onClick when provided", () => {
    const onClick = vi.fn();

    renderHeaderAction({
      label: "New Customer",
      onClick,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "New Customer",
      }),
    );

    expect(onClick).toHaveBeenCalledTimes(1);

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("navigates to action.path when onClick is not provided", () => {
    renderHeaderAction({
      label: "New Customer",
      path: "/customers/new",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "New Customer",
      }),
    );

    expect(navigateMock).toHaveBeenCalledTimes(1);

    expect(navigateMock).toHaveBeenCalledWith("/customers/new");
  });

  it("does not navigate when neither onClick nor path is provided", () => {
    renderHeaderAction({
      label: "New Customer",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "New Customer",
      }),
    );

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("prioritizes onClick over path", () => {
    const onClick = vi.fn();

    renderHeaderAction({
      label: "New Customer",
      path: "/customers/new",
      onClick,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "New Customer",
      }),
    );

    expect(onClick).toHaveBeenCalledTimes(1);

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("works with a page-specific customer action", () => {
    renderHeaderAction({
      label: "New Customer",
      icon: "person_add",
      path: "/customers/new",
    });

    expect(
      screen.getByRole("button", {
        name: "New Customer",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("person_add")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "New Customer",
      }),
    );

    expect(navigateMock).toHaveBeenCalledWith("/customers/new");
  });

  it("works with a page-specific vehicle action", () => {
    renderHeaderAction({
      label: "New Vehicle",
      icon: "directions_car",
      path: "/vehicles/new",
    });

    expect(
      screen.getByRole("button", {
        name: "New Vehicle",
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "New Vehicle",
      }),
    );

    expect(navigateMock).toHaveBeenCalledWith("/vehicles/new");
  });

  it("works with a page-specific driver action", () => {
    renderHeaderAction({
      label: "New Driver",
      icon: "badge",
      path: "/drivers/new",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "New Driver",
      }),
    );

    expect(navigateMock).toHaveBeenCalledWith("/drivers/new");
  });

  it("works with a page-specific trip action", () => {
    renderHeaderAction({
      label: "New Trip",
      icon: "route",
      path: "/trips/new",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "New Trip",
      }),
    );

    expect(navigateMock).toHaveBeenCalledWith("/trips/new");
  });

  it("works with a payment action", () => {
    renderHeaderAction({
      label: "Record Payment",
      icon: "payments",
      path: "/payments/new",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Record Payment",
      }),
    );

    expect(navigateMock).toHaveBeenCalledWith("/payments/new");
  });

  it("supports an empty string label by rendering nothing", () => {
    const { container } = renderHeaderAction({
      label: "",
      path: "/customers/new",
    });

    expect(container.firstChild).toBeNull();
  });

  it("passes only one navigation call for a single click", () => {
    renderHeaderAction({
      label: "New Invoice",
      path: "/invoices/new",
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "New Invoice",
      }),
    );

    expect(navigateMock).toHaveBeenCalledTimes(1);
  });
});
