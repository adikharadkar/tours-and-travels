import { createContext, forwardRef, useContext, useId, useState } from "react";

const TabsContext = createContext(null);

function useTabsContext() {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error("Tabs components must be used inside Tabs");
  }

  return context;
}

const Tabs = forwardRef(function Tabs(
  { children, defaultValue, value, onValueChange, className = "", ...props },
  ref,
) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const tabsId = useId();

  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internalValue;

  function handleValueChange(nextValue) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  return (
    <TabsContext.Provider
      value={{
        activeValue,
        onValueChange: handleValueChange,
        tabsId,
      }}
    >
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});

const TabsList = forwardRef(function TabsList(
  { children, className = "", ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role="tablist"
      className={[
        "inline-flex items-center gap-1",
        "rounded-lg border border-border",
        "bg-background p-1",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
});

const TabsTrigger = forwardRef(function TabsTrigger(
  { value, children, disabled = false, className = "", ...props },
  ref,
) {
  const { activeValue, onValueChange, tabsId } = useTabsContext();

  const isActive = activeValue === value;

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={`${tabsId}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${tabsId}-panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => onValueChange(value)}
      className={[
        "rounded-md px-3 py-2",
        "text-sm font-medium",
        "transition-colors",
        "focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-focus",
        "disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-surface text-foreground shadow-sm"
          : "text-muted hover:text-foreground",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
});

const TabsContent = forwardRef(function TabsContent(
  { value, children, className = "", forceMount = false, ...props },
  ref,
) {
  const { activeValue, tabsId } = useTabsContext();

  const isActive = activeValue === value;

  if (!isActive && !forceMount) {
    return null;
  }

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={`${tabsId}-panel-${value}`}
      aria-labelledby={`${tabsId}-tab-${value}`}
      hidden={!isActive}
      tabIndex={0}
      className={[
        "mt-4",
        "focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-focus",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
});

export { Tabs, TabsList, TabsTrigger, TabsContent };

export default Tabs;
