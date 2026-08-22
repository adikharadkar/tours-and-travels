import { forwardRef } from "react";

const variantStyles = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",

  secondary:
    "border border-border bg-surface text-foreground hover:bg-background",

  danger: "bg-red-600 text-white hover:bg-red-700",

  ghost: "text-foreground hover:bg-background",
};

const sizeStyles = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    type = "button",
    className = "",
    disabled = false,
    ...props
  },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center rounded-md",
        "font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-focus focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
});

export default Button;
