import { forwardRef } from "react";

const Switch = forwardRef(function Switch(
  { className = "", disabled = false, ...props },
  ref,
) {
  return (
    <label
      className={[
        "relative inline-flex shrink-0 cursor-pointer items-center",
        disabled && "cursor-not-allowed opacity-50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />

      <span
        aria-hidden="true"
        className={[
          "relative h-6 w-11 rounded-full",
          "bg-border transition-colors",
          "peer-checked:bg-primary",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-focus/20",
          "after:absolute after:left-1 after:top-1",
          "after:h-4 after:w-4 after:rounded-full",
          "after:bg-white after:transition-transform",
          "peer-checked:after:translate-x-5",
        ].join(" ")}
      />
    </label>
  );
});

export default Switch;
