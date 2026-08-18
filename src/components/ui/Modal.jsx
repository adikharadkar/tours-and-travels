import { forwardRef, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const Modal = forwardRef(function Modal(
  { open, onClose, children, className = "", closeOnOverlayClick = true },
  ref,
) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      modalRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  function handleOverlayClick(event) {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={handleOverlayClick}
    >
      <div
        ref={(node) => {
          modalRef.current = node;

          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={[
          "w-full max-w-lg rounded-lg border border-border",
          "bg-surface text-foreground shadow-lg",
          "outline-none",
          className,
        ].join(" ")}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
});

const ModalHeader = forwardRef(function ModalHeader(
  { children, className = "", ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={[
        "flex items-start justify-between gap-4",
        "border-b border-border p-6",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
});

const ModalTitle = forwardRef(function ModalTitle(
  { children, className = "", ...props },
  ref,
) {
  return (
    <h2
      ref={ref}
      className={["text-lg font-semibold", className].join(" ")}
      {...props}
    >
      {children}
    </h2>
  );
});

const ModalDescription = forwardRef(function ModalDescription(
  { children, className = "", ...props },
  ref,
) {
  return (
    <p
      ref={ref}
      className={["mt-1 text-sm text-muted", className].join(" ")}
      {...props}
    >
      {children}
    </p>
  );
});

const ModalContent = forwardRef(function ModalContent(
  { children, className = "", ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={["max-h-[70vh] overflow-y-auto p-6", className].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
});

const ModalFooter = forwardRef(function ModalFooter(
  { children, className = "", ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={[
        "flex items-center justify-end gap-3",
        "border-t border-border p-6",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
});

const ModalClose = forwardRef(function ModalClose(
  { onClose, className = "", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label="Close modal"
      onClick={onClose}
      className={[
        "rounded-md p-2 text-muted transition-colors",
        "hover:bg-background hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-focus",
        className,
      ].join(" ")}
      {...props}
    >
      <span aria-hidden="true">✕</span>
    </button>
  );
});

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  ModalClose,
};

export default Modal;
