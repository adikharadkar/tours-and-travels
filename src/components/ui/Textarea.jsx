import { forwardRef } from "react";

const Textarea = forwardRef(function Textarea(
  { className = "", disabled = false, rows = 4, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      disabled={disabled}
      className={[
        "w-full rounded-md border border-border bg-surface px-3 py-2",
        "text-sm text-foreground placeholder:text-muted",
        "transition-colors resize-y",
        "focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      ].join(" ")}
      {...props}
    />
  );
});

export default Textarea;
