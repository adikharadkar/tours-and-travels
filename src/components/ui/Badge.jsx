const variantStyles = {
  default: "bg-background text-foreground border-border",
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  error: "bg-error/10 text-error border-error/20",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
}) {
  return (
    <span
      className={[
        "inline-flex items-center",
        "rounded-full border",
        "px-2.5 py-1",
        "text-xs font-medium",
        "whitespace-nowrap",
        variantStyles[variant] ?? variantStyles.default,
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
