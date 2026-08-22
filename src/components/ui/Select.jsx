import { forwardRef } from "react";

const Select = forwardRef(function Select(
  {
    children,
    options = [],
    className = "",
    disabled = false,
    placeholder,
    ...props
  },
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
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}

      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}

      {children}
    </select>
  );
});

export default Select;
