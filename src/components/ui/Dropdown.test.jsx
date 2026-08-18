import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Dropdown, { DropdownDivider, DropdownItem } from "./Dropdown";

function renderDropdown(props = {}) {
  const onEdit = props.onEdit ?? vi.fn();
  const onDelete = props.onDelete ?? vi.fn();

  const renderResult = render(
    <Dropdown trigger={<button type="button">Actions</button>} {...props}>
      <DropdownItem onClick={onEdit}>Edit</DropdownItem>

      <DropdownItem onClick={onDelete}>Delete</DropdownItem>

      <DropdownDivider />

      <DropdownItem>View</DropdownItem>
    </Dropdown>,
  );

  return {
    ...renderResult,
    onEdit,
    onDelete,
  };
}

describe("Dropdown", () => {
  it("renders the trigger", () => {
    renderDropdown();

    expect(
      screen.getByRole("button", {
        name: "Actions",
      }),
    ).toBeInTheDocument();
  });

  it("does not show the menu initially", () => {
    renderDropdown();

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens when the trigger is clicked", async () => {
    const user = userEvent.setup();

    renderDropdown();

    await user.click(
      screen.getByRole("button", {
        name: "Actions",
      }),
    );

    expect(screen.getByRole("menu")).toBeInTheDocument();

    expect(
      screen.getByRole("menuitem", {
        name: "Edit",
      }),
    ).toBeInTheDocument();
  });

  it("closes when the trigger is clicked again", async () => {
    const user = userEvent.setup();

    renderDropdown();

    const trigger = screen.getByRole("button", {
      name: "Actions",
    });

    await user.click(trigger);
    await user.click(trigger);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("calls the item callback", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    renderDropdown({ onEdit });

    await user.click(
      screen.getByRole("button", {
        name: "Actions",
      }),
    );

    await user.click(
      screen.getByRole("menuitem", {
        name: "Edit",
      }),
    );

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("closes after selecting an item", async () => {
    const user = userEvent.setup();

    renderDropdown();

    await user.click(
      screen.getByRole("button", {
        name: "Actions",
      }),
    );

    await user.click(
      screen.getByRole("menuitem", {
        name: "Edit",
      }),
    );

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes when Escape is pressed", async () => {
    const user = userEvent.setup();

    renderDropdown();

    await user.click(
      screen.getByRole("button", {
        name: "Actions",
      }),
    );

    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes when clicking outside", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <Dropdown trigger={<button type="button">Actions</button>}>
          <DropdownItem>Edit</DropdownItem>
        </Dropdown>

        <button type="button">Outside</button>
      </div>,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Actions",
      }),
    );

    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Outside",
      }),
    );

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("supports disabled items", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <Dropdown trigger={<button type="button">Actions</button>}>
        <DropdownItem onClick={onDelete} disabled>
          Delete
        </DropdownItem>
      </Dropdown>,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Actions",
      }),
    );

    const deleteItem = screen.getByRole("menuitem", {
      name: "Delete",
    });

    expect(deleteItem).toBeDisabled();

    await user.click(deleteItem);

    expect(onDelete).not.toHaveBeenCalled();
  });

  it("renders a divider", async () => {
    const user = userEvent.setup();

    renderDropdown();

    await user.click(
      screen.getByRole("button", {
        name: "Actions",
      }),
    );

    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("supports right alignment", async () => {
    const user = userEvent.setup();

    renderDropdown({
      align: "right",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Actions",
      }),
    );

    expect(screen.getByRole("menu")).toHaveClass("right-0");
  });
});
