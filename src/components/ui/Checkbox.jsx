import { forwardRef } from "react";

const Checkbox = forwardRef(function Checkbox(
  { className = "", disabled = false, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      disabled={disabled}
      className={[
        "h-4 w-4 shrink-0 rounded border border-border",
        "accent-primary",
        "focus:outline-none focus:ring-2 focus:ring-focus/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      ].join(" ")}
      {...props}
    />
  );
});

export default Checkbox;
