export default function Spinner({
  size = "md",
  className = "",
  decorative = false,
}) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-2",
    xl: "h-10 w-10 border-4",
    xl2: "h-12 w-12 border-4",
  };

  return (
    <span
      {...(decorative
        ? { "aria-hidden": "true" }
        : {
            role: "status",
            "aria-label": "Loading",
          })}
      className={[
        "inline-block animate-spin rounded-full",
        "border-border border-t-primary",
        sizes[size] ?? sizes.md,
        className,
      ].join(" ")}
    />
  );
}
