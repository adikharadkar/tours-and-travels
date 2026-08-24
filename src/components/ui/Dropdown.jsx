import { useEffect, useRef, useState } from "react";

export default function Dropdown({
  trigger,
  children,
  align = "left",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState("bottom");

  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function updatePlacement() {
      const triggerElement = dropdownRef.current;

      const menuElement = menuRef.current;

      if (!triggerElement || !menuElement) {
        return;
      }

      const triggerRect = triggerElement.getBoundingClientRect();

      const menuRect = menuElement.getBoundingClientRect();

      const spaceBelow = window.innerHeight - triggerRect.bottom;

      const spaceAbove = triggerRect.top;

      const shouldOpenAbove =
        spaceBelow < menuRect.height + 8 && spaceAbove >= menuRect.height + 8;

      setPlacement(shouldOpenAbove ? "top" : "bottom");
    }

    requestAnimationFrame(updatePlacement);

    window.addEventListener("resize", updatePlacement);

    window.addEventListener("scroll", updatePlacement, true);

    return () => {
      window.removeEventListener("resize", updatePlacement);

      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleTriggerClick() {
    setOpen((current) => !current);
  }

  function handleItemClick() {
    setOpen(false);
  }

  const alignmentClass = align === "right" ? "right-0" : "left-0";

  const placementClass =
    placement === "top" ? "bottom-full mb-2" : "top-full mt-2";

  return (
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

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className={[
            "absolute z-50 min-w-48",
            "rounded-xl border border-slate-200 dark:border-[#262837]",
            "bg-white dark:bg-[#161822] p-1.5 shadow-xl shadow-slate-900/10 dark:shadow-black/50",
            alignmentClass,
            placementClass,
          ].join(" ")}
          onClick={handleItemClick}
        >
          {children}
        </div>
      )}
    </div>
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
        "hover:bg-slate-100 dark:hover:bg-[#202330] hover:text-slate-900 dark:hover:text-white",
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
