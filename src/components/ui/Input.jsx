import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { type = "text", className = "", disabled = false, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      disabled={disabled}
      className={[
        "h-10 w-full rounded-md border border-border bg-surface px-3",
        "text-sm text-foreground placeholder:text-muted",
        "transition-colors",
        "focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      ].join(" ")}
      {...props}
    />
  );
});

export default Input;
