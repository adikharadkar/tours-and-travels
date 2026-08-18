export default function EmptyState({
  title = "No data found",
  description,
  icon,
  action,
  className = "",
}) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center",
        "rounded-lg border border-border",
        "bg-surface px-6 py-12 text-center",
        className,
      ].join(" ")}
    >
      {icon && (
        <div
          aria-hidden="true"
          className={[
            "mb-4 flex h-12 w-12 items-center justify-center",
            "rounded-full bg-background text-muted",
          ].join(" ")}
        >
          {icon}
        </div>
      )}

      <h2 className="text-base font-semibold text-foreground">{title}</h2>

      {description && (
        <p className="mt-2 max-w-md text-sm leading-5 text-muted">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
