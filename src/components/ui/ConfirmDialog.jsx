import { forwardRef } from "react";

import Button from "./Button";
import {
  Modal,
  ModalClose,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "./Modal";

const ConfirmDialog = forwardRef(function ConfirmDialog(
  {
    open,
    onClose,
    onConfirm,
    title = "Are you sure?",
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    loading = false,
    className = "",
  },
  ref,
) {
  return (
    <Modal
      ref={ref}
      open={open}
      onClose={onClose}
      className={className}
      closeOnOverlayClick={!loading}
    >
      <ModalHeader>
        <div>
          <ModalTitle>{title}</ModalTitle>

          {description && <ModalDescription>{description}</ModalDescription>}
        </div>

        <ModalClose onClose={onClose} disabled={loading} />
      </ModalHeader>

      <ModalFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>

        <Button
          type="button"
          variant={variant}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Processing..." : confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
});

export default ConfirmDialog;
