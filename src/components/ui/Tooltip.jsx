import {
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

const placementStyles = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "left-1/2 top-full mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
};

const arrowStyles = {
  top: "left-1/2 top-full -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent",
  bottom:
    "left-1/2 bottom-full -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent",
  left: "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent",
  right:
    "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent",
};

const Tooltip = forwardRef(function Tooltip(
  {
    children,
    content,
    placement = "top",
    delay = 300,
    disabled = false,
    className = "",
    ...props
  },
  ref,
) {
  const [open, setOpen] = useState(false);

  const timeoutRef = useRef(null);
  const tooltipId = useId();

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const showTooltip = () => {
    if (disabled || !content) {
      return;
    }

    clearTimer();

    if (delay <= 0) {
      setOpen(true);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      setOpen(true);
      timeoutRef.current = null;
    }, delay);
  };

  const hideTooltip = () => {
    clearTimer();
    setOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      hideTooltip();
    }
  };

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  if (disabled || !content || !isValidElement(children)) {
    return children;
  }

  const position = placementStyles[placement] ?? placementStyles.top;
  const arrow = arrowStyles[placement] ?? arrowStyles.top;

  const triggerProps = {
    ...props,

    ref,

    "aria-describedby": open ? tooltipId : undefined,

    onMouseEnter: (event) => {
      children.props.onMouseEnter?.(event);
      showTooltip();
    },

    onMouseLeave: (event) => {
      children.props.onMouseLeave?.(event);
      hideTooltip();
    },

    onFocus: (event) => {
      children.props.onFocus?.(event);
      showTooltip();
    },

    onBlur: (event) => {
      children.props.onBlur?.(event);
      hideTooltip();
    },

    onKeyDown: (event) => {
      children.props.onKeyDown?.(event);
      handleKeyDown(event);
    },
  };

  const trigger = cloneElement(children, triggerProps);

  return (
    <span className="relative inline-flex">
      {trigger}

      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className={[
            "pointer-events-none absolute z-[110]",
            "w-max max-w-xs",
            position,
            "rounded-md",
            "bg-foreground text-background",
            "px-3 py-1.5",
            "text-xs font-medium",
            "shadow-lg",
            className,
          ].join(" ")}
        >
          {content}

          <span
            aria-hidden="true"
            className={[
              "absolute h-0 w-0",
              "border-4 border-foreground",
              arrow,
            ].join(" ")}
          />
        </span>
      )}
    </span>
  );
});

export default Tooltip;
