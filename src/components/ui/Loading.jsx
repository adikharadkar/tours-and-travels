import Spinner from "./Spinner";

export default function Loading({
  size = "md",
  label = "Loading...",
  className = "",
}) {
  return (
    <div
      role="status"
      aria-label={label || "Loading"}
      className={["flex items-center justify-center gap-2", className].join(
        " ",
      )}
    >
      <Spinner size={size} decorative />

      {label && <span className="text-sm text-muted">{label}</span>}
    </div>
  );
}
