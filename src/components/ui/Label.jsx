import { forwardRef } from "react";

const Label = forwardRef(function Label(
  { children, className = "", ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={[
        "text-sm font-medium text-foreground",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </label>
  );
});

export default Label;
