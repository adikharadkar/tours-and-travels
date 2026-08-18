import { forwardRef } from "react";

const Select = forwardRef(function Select(
  { children, className = "", disabled = false, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      disabled={disabled}
      className={[
        "h-10 w-full rounded-md border border-border bg-surface px-3",
        "text-sm text-foreground",
        "transition-colors",
        "focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </select>
  );
});

export default Select;
