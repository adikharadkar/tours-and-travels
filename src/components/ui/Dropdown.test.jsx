import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Dropdown, { DropdownItem, DropdownDivider } from "./Dropdown";

describe("Dropdown", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    });

    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: 768,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderDropdown = (props = {}) => {
    return render(
      <Dropdown trigger={<button type="button">Open Menu</button>} {...props}>
        <DropdownItem>First Item</DropdownItem>
        <DropdownItem>Second Item</DropdownItem>
      </Dropdown>,
    );
  };

  it("renders the trigger", () => {
    renderDropdown();

    expect(
      screen.getByRole("button", { name: "Open Menu" }),
    ).toBeInTheDocument();
  });

  it("renders the trigger with aria-haspopup set to menu", () => {
    renderDropdown();

    const trigger = screen
      .getByText("Open Menu")
      .closest('[aria-haspopup="menu"]');

    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
  });

  it("starts with the dropdown closed", () => {
    renderDropdown();

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByText("Open Menu").parentElement).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("opens the dropdown when the trigger is clicked", async () => {
    renderDropdown();

    const trigger = screen.getByRole("button", {
      name: "Open Menu",
    });

    await act(async () => {
      fireEvent.click(trigger);
    });

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "First Item" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Second Item" }),
    ).toBeInTheDocument();
  });

  it("sets aria-expanded to true when opened", async () => {
    renderDropdown();

    const triggerButton = screen.getByRole("button", {
      name: "Open Menu",
    });

    const triggerWrapper = triggerButton.parentElement;

    expect(triggerWrapper).toHaveAttribute("aria-expanded", "false");

    await act(async () => {
      fireEvent.click(triggerButton);
    });

    expect(triggerWrapper).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the dropdown when the trigger is clicked again", async () => {
    renderDropdown();

    const trigger = screen.getByRole("button", {
      name: "Open Menu",
    });

    await act(async () => {
      fireEvent.click(trigger);
    });

    expect(screen.getByRole("menu")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(trigger);
    });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the dropdown when clicking outside", async () => {
    renderDropdown();

    const trigger = screen.getByRole("button", {
      name: "Open Menu",
    });

    await act(async () => {
      fireEvent.click(trigger);
    });

    expect(screen.getByRole("menu")).toBeInTheDocument();

    await act(async () => {
      fireEvent.mouseDown(document.body);
    });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("does not close when clicking inside the menu", async () => {
    renderDropdown();

    const trigger = screen.getByRole("button", {
      name: "Open Menu",
    });

    await act(async () => {
      fireEvent.click(trigger);
    });

    const menu = screen.getByRole("menu");

    await act(async () => {
      fireEvent.mouseDown(menu);
    });

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("closes when Escape is pressed", async () => {
    renderDropdown();

    const trigger = screen.getByRole("button", {
      name: "Open Menu",
    });

    await act(async () => {
      fireEvent.click(trigger);
    });

    expect(screen.getByRole("menu")).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(document, {
        key: "Escape",
      });
    });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("does not close for unrelated keyboard keys", async () => {
    renderDropdown();

    const trigger = screen.getByRole("button", {
      name: "Open Menu",
    });

    await act(async () => {
      fireEvent.click(trigger);
    });

    await act(async () => {
      fireEvent.keyDown(document, {
        key: "Enter",
      });
    });

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("closes when a menu item is clicked", async () => {
    const handleClick = vi.fn();

    render(
      <Dropdown trigger={<button type="button">Actions</button>}>
        <DropdownItem onClick={handleClick}>Edit</DropdownItem>
        <DropdownItem>Delete</DropdownItem>
      </Dropdown>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Actions" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();

    const editItem = screen.getByRole("menuitem", { name: "Edit" });

    fireEvent.click(editItem);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("calls DropdownItem onClick handler", async () => {
    const handleClick = vi.fn();

    render(
      <Dropdown trigger={<button>Open Menu</button>}>
        <DropdownItem onClick={handleClick}>Action</DropdownItem>
      </Dropdown>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Menu" }));

    fireEvent.click(
      screen.getByRole("menuitem", {
        name: "Action",
      }),
    );

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders disabled DropdownItem", async () => {
    const handleClick = vi.fn();

    render(
      <Dropdown trigger={<button>Open Menu</button>}>
        <DropdownItem disabled onClick={handleClick}>
          Disabled Action
        </DropdownItem>
      </Dropdown>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Menu" }));

    const item = screen.getByRole("menuitem", {
      name: "Disabled Action",
    });

    expect(item).toBeDisabled();

    fireEvent.click(item);

    expect(handleClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders DropdownDivider as a separator", async () => {
    render(
      <Dropdown trigger={<button>Open Menu</button>}>
        <DropdownItem>First Item</DropdownItem>
        <DropdownDivider />
        <DropdownItem>Second Item</DropdownItem>
      </Dropdown>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open Menu" }));

    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "First Item" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Second Item" }),
    ).toBeInTheDocument();
  });

  it("renders the menu through a portal on document.body", async () => {
    renderDropdown();

    fireEvent.click(screen.getByRole("button", { name: "Open Menu" }));

    const menu = screen.getByRole("menu");

    expect(menu.parentElement).toBe(document.body);
  });

  it("uses bottom placement by default when there is enough space below", async () => {
    const triggerRect = {
      top: 100,
      bottom: 140,
      left: 100,
      right: 200,
      width: 100,
      height: 40,
    };

    const menuRect = {
      top: 0,
      bottom: 100,
      left: 0,
      right: 200,
      width: 200,
      height: 100,
    };

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function () {
        if (this.getAttribute("role") === "menu") {
          return menuRect;
        }

        return triggerRect;
      },
    );

    renderDropdown();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Open Menu" }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    const menu = screen.getByRole("menu");

    expect(menu).toHaveAttribute("data-placement", "bottom");
  });

  it("opens above the trigger when there is not enough space below", async () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: 500,
    });

    const triggerRect = {
      top: 400,
      bottom: 440,
      left: 100,
      right: 200,
      width: 100,
      height: 40,
    };

    const menuRect = {
      top: 0,
      bottom: 150,
      left: 0,
      right: 200,
      width: 200,
      height: 150,
    };

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function () {
        if (this.getAttribute("role") === "menu") {
          return menuRect;
        }

        return triggerRect;
      },
    );

    renderDropdown();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Open Menu" }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    const menu = screen.getByRole("menu");

    expect(menu).toHaveAttribute("data-placement", "top");
  });

  it("supports right alignment", async () => {
    const triggerRect = {
      top: 100,
      bottom: 140,
      left: 500,
      right: 700,
      width: 200,
      height: 40,
    };

    const menuRect = {
      top: 0,
      bottom: 100,
      left: 0,
      right: 150,
      width: 150,
      height: 100,
    };

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function () {
        if (this.getAttribute("role") === "menu") {
          return menuRect;
        }

        return triggerRect;
      },
    );

    renderDropdown({
      align: "right",
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Open Menu" }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    const menu = screen.getByRole("menu");

    expect(menu.style.left).toBe("550px");
  });

  it("keeps the dropdown within the horizontal viewport", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 500,
    });

    const triggerRect = {
      top: 100,
      bottom: 140,
      left: 450,
      right: 500,
      width: 50,
      height: 40,
    };

    const menuRect = {
      top: 0,
      bottom: 100,
      left: 0,
      right: 300,
      width: 300,
      height: 100,
    };

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function () {
        if (this.getAttribute("role") === "menu") {
          return menuRect;
        }

        return triggerRect;
      },
    );

    renderDropdown();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Open Menu" }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    const menu = screen.getByRole("menu");

    expect(menu.style.left).toBe("192px");
  });

  it("keeps the dropdown within the vertical viewport", async () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: 200,
    });

    const triggerRect = {
      top: 160,
      bottom: 190,
      left: 50,
      right: 150,
      width: 100,
      height: 30,
    };

    const menuRect = {
      top: 0,
      bottom: 180,
      left: 0,
      right: 200,
      width: 200,
      height: 180,
    };

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function () {
        if (this.getAttribute("role") === "menu") {
          return menuRect;
        }

        return triggerRect;
      },
    );

    renderDropdown();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Open Menu" }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    const menu = screen.getByRole("menu");

    expect(menu.style.top).toBe("12px");
  });

  it("applies the supplied className to the trigger container", () => {
    renderDropdown({
      className: "custom-dropdown-class",
    });

    const triggerButton = screen.getByRole("button", {
      name: "Open Menu",
    });

    expect(triggerButton.parentElement.parentElement).toHaveClass(
      "custom-dropdown-class",
    );
  });

  it("updates its position on window resize", async () => {
    const getBoundingClientRectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function () {
        if (this.getAttribute("role") === "menu") {
          return {
            top: 0,
            bottom: 100,
            left: 0,
            right: 200,
            width: 200,
            height: 100,
          };
        }

        return {
          top: 100,
          bottom: 140,
          left: 100,
          right: 200,
          width: 100,
          height: 40,
        };
      });

    renderDropdown();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Open Menu" }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    const initialCallCount = getBoundingClientRectSpy.mock.calls.length;

    await act(async () => {
      fireEvent(window, new Event("resize"));
    });

    expect(getBoundingClientRectSpy.mock.calls.length).toBeGreaterThan(
      initialCallCount,
    );
  });

  it("updates its position on scroll", async () => {
    const getBoundingClientRectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function () {
        if (this.getAttribute("role") === "menu") {
          return {
            top: 0,
            bottom: 100,
            left: 0,
            right: 200,
            width: 200,
            height: 100,
          };
        }

        return {
          top: 100,
          bottom: 140,
          left: 100,
          right: 200,
          width: 100,
          height: 40,
        };
      });

    renderDropdown();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Open Menu" }));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    const initialCallCount = getBoundingClientRectSpy.mock.calls.length;

    await act(async () => {
      fireEvent.scroll(window);
    });

    expect(getBoundingClientRectSpy.mock.calls.length).toBeGreaterThan(
      initialCallCount,
    );
  });

  it("does not open when clicking a child outside the trigger", () => {
    renderDropdown();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
