import { forwardRef, useId } from "react";

const SearchInput = forwardRef(function SearchInput(
  {
    value = "",
    onChange,
    placeholder = "Search...",
    disabled = false,
    className = "",
    id,
    name,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="relative w-full">
      <label htmlFor={inputId} className="sr-only">
        Search
      </label>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-4 w-4"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>

      <input
        ref={ref}
        id={inputId}
        name={name}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={[
          "w-full rounded-md border border-border",
          "bg-surface text-foreground",
          "py-2 pl-9 pr-3",
          "text-sm",
          "outline-none transition-colors",
          "placeholder:text-muted",
          "focus:border-primary",
          "focus:ring-2 focus:ring-primary/20",
          "disabled:cursor-not-allowed",
          "disabled:opacity-50",
          className,
        ].join(" ")}
        {...props}
      />
    </div>
  );
});

export default SearchInput;
