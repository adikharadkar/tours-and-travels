import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ConfirmDialog from "./ConfirmDialog";

function renderConfirmDialog(props = {}) {
  const onClose = props.onClose ?? vi.fn();
  const onConfirm = props.onConfirm ?? vi.fn();

  const renderResult = render(
    <ConfirmDialog
      open
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete invoice?"
      description="This action cannot be undone."
      {...props}
    />,
  );

  return {
    ...renderResult,
    onClose,
    onConfirm,
  };
}

describe("ConfirmDialog", () => {
  it("renders when open", () => {
    renderConfirmDialog();

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Delete invoice?",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("This action cannot be undone."),
    ).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <ConfirmDialog open={false} onClose={vi.fn()} onConfirm={vi.fn()} />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderConfirmDialog({ onConfirm });

    await user.click(
      screen.getByRole("button", {
        name: "Confirm",
      }),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderConfirmDialog({ onClose });

    await user.click(
      screen.getByRole("button", {
        name: "Cancel",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderConfirmDialog({ onClose });

    await user.click(
      screen.getByRole("button", {
        name: "Close modal",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("supports custom title", () => {
    renderConfirmDialog({
      title: "Archive customer?",
    });

    expect(
      screen.getByRole("heading", {
        name: "Archive customer?",
      }),
    ).toBeInTheDocument();
  });

  it("supports custom description", () => {
    renderConfirmDialog({
      description: "The customer will be archived.",
    });

    expect(
      screen.getByText("The customer will be archived."),
    ).toBeInTheDocument();
  });

  it("supports custom button text", () => {
    renderConfirmDialog({
      confirmText: "Delete",
      cancelText: "Keep",
    });

    expect(
      screen.getByRole("button", {
        name: "Delete",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Keep",
      }),
    ).toBeInTheDocument();
  });

  it("shows processing state when loading", () => {
    renderConfirmDialog({
      loading: true,
    });

    expect(
      screen.getByRole("button", {
        name: "Processing...",
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole("button", {
        name: "Cancel",
      }),
    ).toBeDisabled();

    expect(
      screen.getByRole("button", {
        name: "Close modal",
      }),
    ).toBeDisabled();
  });

  it("does not allow closing through the overlay while loading", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderConfirmDialog({
      loading: true,
      onClose,
    });

    const dialog = screen.getByRole("dialog");
    const overlay = dialog.parentElement;

    await user.click(overlay);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("allows closing through the overlay when not loading", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderConfirmDialog({ onClose });

    const dialog = screen.getByRole("dialog");
    const overlay = dialog.parentElement;

    await user.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("supports a custom button variant", () => {
    renderConfirmDialog({
      variant: "primary",
    });

    const confirmButton = screen.getByRole("button", {
      name: "Confirm",
    });

    expect(confirmButton).toBeInTheDocument();
  });
});
