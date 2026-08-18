import { forwardRef, useId } from "react";

import Label from "./Label";

const FormField = forwardRef(function FormField(
  { label, error, description, required = false, children, className = "" },
  ref,
) {
  const generatedId = useId();

  const describedBy = [
    description ? `${generatedId}-description` : null,
    error ? `${generatedId}-error` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={["space-y-2", className].join(" ")}>
      {label && (
        <Label htmlFor={generatedId}>
          {label}

          {required && (
            <span className="ml-1 text-red-600" aria-hidden="true">
              *
            </span>
          )}
        </Label>
      )}

      <div>
        {children({
          id: generatedId,
          ref,
          "aria-describedby": describedBy || undefined,
          "aria-invalid": error ? "true" : undefined,
        })}
      </div>

      {description && !error && (
        <p id={`${generatedId}-description`} className="text-sm text-muted">
          {description}
        </p>
      )}

      {error && (
        <p
          id={`${generatedId}-error`}
          className="text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

export default FormField;
