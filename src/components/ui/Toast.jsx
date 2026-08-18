import { useEffect } from "react";

const variantStyles = {
  success: {
    border: "border-success/20",
    iconBackground: "bg-success/10",
    icon: "✓",
    iconColor: "text-success",
    progressBackground: "bg-success",
    progressTrack: "bg-success/10",
  },

  error: {
    border: "border-error/20",
    iconBackground: "bg-error/10",
    icon: "!",
    iconColor: "text-error",
    progressBackground: "bg-error",
    progressTrack: "bg-error/10",
  },

  warning: {
    border: "border-warning/20",
    iconBackground: "bg-warning/10",
    icon: "!",
    iconColor: "text-warning",
    progressBackground: "bg-warning",
    progressTrack: "bg-warning/10",
  },

  info: {
    border: "border-primary/20",
    iconBackground: "bg-primary/10",
    icon: "i",
    iconColor: "text-primary",
    progressBackground: "bg-primary",
    progressTrack: "bg-primary/10",
  },
};

export default function Toast({
  id,
  title,
  message,
  variant = "info",
  duration = 5000,
  onClose,
}) {
  const styles = variantStyles[variant] ?? variantStyles.info;

  useEffect(() => {
    if (duration <= 0) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => {
      clearTimeout(timeout);
    };
  }, [id, duration, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "relative w-full max-w-sm overflow-hidden",
        "rounded-xl border",
        "bg-surface text-foreground",
        "shadow-xl",
        styles.border,
      ].join(" ")}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center",
            "rounded-full",
            styles.iconBackground,
          ].join(" ")}
        >
          <span
            aria-hidden="true"
            className={["text-sm font-bold", styles.iconColor].join(" ")}
          >
            {styles.icon}
          </span>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 pt-0.5">
          {title && (
            <p className="text-sm font-semibold text-foreground">{title}</p>
          )}

          {message && (
            <p className="mt-1 text-sm leading-5 text-muted">{message}</p>
          )}
        </div>

        {/* Close */}
        <button
          type="button"
          aria-label="Close notification"
          onClick={() => onClose(id)}
          className={[
            "flex h-7 w-7 shrink-0 items-center justify-center",
            "rounded-md text-muted",
            "transition-colors",
            "hover:bg-background hover:text-foreground",
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-focus",
          ].join(" ")}
        >
          <span aria-hidden="true" className="text-sm">
            ✕
          </span>
        </button>
      </div>

      {/* Progress */}
      {duration > 0 && (
        <div
          className={["h-1 w-full", styles.progressTrack].join(" ")}
          aria-hidden="true"
        >
          <div
            className={["h-full origin-left", styles.progressBackground].join(
              " ",
            )}
            style={{
              animation: `toast-progress ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}
