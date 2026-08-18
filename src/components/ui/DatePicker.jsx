import { forwardRef, useId } from "react";

const DatePicker = forwardRef(function DatePicker(
  {
    label,
    value = "",
    onChange,
    error,
    helperText,
    disabled = false,
    required = false,
    min,
    max,
    className = "",
    id,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperTextId = `${inputId}-helper`;

  const hasError = Boolean(error);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {label}

          {required && (
            <span className="ml-1 text-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <input
        ref={ref}
        id={inputId}
        type="date"
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        aria-invalid={hasError}
        aria-describedby={helperText || error ? helperTextId : undefined}
        className={[
          "w-full rounded-md border bg-surface px-3 py-2",
          "text-sm text-foreground",
          "outline-none transition-colors",
          "placeholder:text-muted",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          hasError
            ? "border-danger focus:border-danger focus:ring-danger/20"
            : "border-border",
        ].join(" ")}
        {...props}
      />

      {(error || helperText) && (
        <p
          id={helperTextId}
          className={`mt-1.5 text-xs ${
            hasError ? "text-danger" : "text-muted"
          }`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

export default DatePicker;
