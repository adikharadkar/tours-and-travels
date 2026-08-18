import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Modal, {
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "./Modal";

function renderModal(props = {}) {
  const onClose = props.onClose ?? vi.fn();

  const renderResult = render(
    <Modal open onClose={onClose} {...props}>
      <ModalHeader>
        <div>
          <ModalTitle>Delete Invoice</ModalTitle>

          <ModalDescription>This action cannot be undone.</ModalDescription>
        </div>

        <ModalClose onClose={onClose} />
      </ModalHeader>

      <ModalContent>Are you sure you want to delete this invoice?</ModalContent>

      <ModalFooter>
        <button type="button" onClick={onClose}>
          Cancel
        </button>

        <button type="button">Delete</button>
      </ModalFooter>
    </Modal>,
  );

  return {
    ...renderResult,
    onClose,
  };
}

describe("Modal", () => {
  it("renders when open", () => {
    renderModal();

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Delete Invoice",
      }),
    ).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <Modal open={false} onClose={vi.fn()}>
        <ModalTitle>Hidden Modal</ModalTitle>
      </Modal>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has dialog accessibility semantics", () => {
    renderModal();

    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderModal({ onClose });

    await user.click(
      screen.getByRole("button", {
        name: "Close modal",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderModal({ onClose });

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the overlay is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderModal({ onClose });

    const dialog = screen.getByRole("dialog");
    const overlay = dialog.parentElement;

    await user.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when the modal content is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderModal({ onClose });

    await user.click(
      screen.getByText("Are you sure you want to delete this invoice?"),
    );

    expect(onClose).not.toHaveBeenCalled();
  });

  it("can disable overlay closing", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderModal({
      onClose,
      closeOnOverlayClick: false,
    });

    const dialog = screen.getByRole("dialog");
    const overlay = dialog.parentElement;

    await user.click(overlay);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("locks body scrolling while open", () => {
    renderModal();

    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body scrolling when unmounted", () => {
    const { unmount } = renderModal();

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("");
  });

  it("renders content through a portal", () => {
    renderModal();

    const dialog = screen.getByRole("dialog");

    expect(dialog).toBeInTheDocument();
    expect(document.body).toContainElement(dialog);
  });
});
