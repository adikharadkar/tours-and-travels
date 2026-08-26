import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function Dropdown({
  trigger,
  children,
  align = "left",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState("bottom");
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
  });

  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = useCallback(() => {
    const triggerElement = dropdownRef.current;
    const menuElement = menuRef.current;

    if (!triggerElement || !menuElement) {
      return;
    }

    const triggerRect = triggerElement.getBoundingClientRect();
    const menuRect = menuElement.getBoundingClientRect();

    const gap = 8;
    const viewportPadding = 8;

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    const shouldOpenAbove =
      spaceBelow < menuRect.height + gap && spaceAbove >= menuRect.height + gap;

    const nextPlacement = shouldOpenAbove ? "top" : "bottom";

    setPlacement(nextPlacement);

    let top =
      nextPlacement === "top"
        ? triggerRect.top - menuRect.height - gap
        : triggerRect.bottom + gap;

    let left =
      align === "right" ? triggerRect.right - menuRect.width : triggerRect.left;

    // Keep the menu inside the viewport horizontally.
    const maxLeft = Math.max(
      viewportPadding,
      window.innerWidth - menuRect.width - viewportPadding,
    );

    left = Math.min(Math.max(left, viewportPadding), maxLeft);

    // Keep the menu inside the viewport vertically.
    const maxTop = Math.max(
      viewportPadding,
      window.innerHeight - menuRect.height - viewportPadding,
    );

    top = Math.min(Math.max(top, viewportPadding), maxTop);

    setPosition({
      top,
      left,
    });
  }, [align]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const frame = requestAnimationFrame(updatePosition);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      cancelAnimationFrame(frame);

      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      const triggerElement = dropdownRef.current;
      const menuElement = menuRef.current;

      const clickedTrigger = triggerElement?.contains(event.target);

      const clickedMenu = menuElement?.contains(event.target);

      if (!clickedTrigger && !clickedMenu) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleTriggerClick = () => {
    setOpen((current) => !current);
  };

  const handleItemClick = () => {
    setOpen(false);
  };

  return (
    <>
      {/* Trigger stays in its original DOM position */}
      <div
        ref={dropdownRef}
        className={["relative inline-block", className].join(" ")}
      >
        <div
          onClick={handleTriggerClick}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          {trigger}
        </div>
      </div>

      {/* Menu is rendered at document.body level so table overflow
          cannot clip it. */}
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className={[
              "fixed z-[9999] min-w-48",
              "rounded-xl border border-slate-200 dark:border-[#262837]",
              "bg-white dark:bg-[#161822]",
              "p-1.5",
              "shadow-xl shadow-slate-900/10 dark:shadow-black/50",
            ].join(" ")}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
            data-placement={placement}
            onClick={handleItemClick}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}

export function DropdownItem({
  children,
  onClick,
  disabled = false,
  className = "",
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex w-full items-center rounded-lg px-3 py-2 text-xs font-medium",
        "text-left text-slate-700 dark:text-slate-200",
        "transition-colors cursor-pointer",
        "hover:bg-slate-100 dark:hover:bg-[#202330]",
        "hover:text-slate-900 dark:hover:text-white",
        "focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function DropdownDivider() {
  return <div role="separator" className="my-1 border-t border-border" />;
}
