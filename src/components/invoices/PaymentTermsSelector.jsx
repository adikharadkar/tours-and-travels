import { useState, useRef, useEffect } from "react";

const PAYMENT_TERMS_PRESETS = [
  {
    value: "Immediate",
    label: "Immediate / Due on Receipt",
    days: 0,
    shortLabel: "Immediate",
    badge: "Instant",
    description: "Full settlement on delivery/invoice receipt",
  },
  {
    value: "Net 7",
    label: "Net 7 Days",
    days: 7,
    shortLabel: "Net 7",
    badge: "1 Week",
    description: "Payment due within 7 calendar days",
  },
  {
    value: "Net 15",
    label: "Net 15 Days",
    days: 15,
    shortLabel: "Net 15",
    badge: "15 Days",
    description: "Standard mid-term corporate credit",
  },
  {
    value: "Net 30",
    label: "Net 30 Days",
    days: 30,
    shortLabel: "Net 30",
    badge: "Standard",
    description: "Standard monthly enterprise credit cycle",
  },
  {
    value: "Net 45",
    label: "Net 45 Days",
    days: 45,
    shortLabel: "Net 45",
    badge: "45 Days",
    description: "Extended enterprise billing cycle",
  },
  {
    value: "Net 60",
    label: "Net 60 Days",
    days: 60,
    shortLabel: "Net 60",
    badge: "60 Days",
    description: "Long-term institutional credit term",
  },
  {
    value: "Custom",
    label: "Custom Days",
    days: null,
    shortLabel: "Custom",
    badge: "Custom",
    description: "Specify arbitrary credit period or exact date",
  },
];

export default function PaymentTermsSelector({
  value = "Net 30",
  onChange,
  issueDate = "",
  dueDate = "",
  onDueDateChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [customDays, setCustomDays] = useState(30);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute current matching preset
  const selectedPreset =
    PAYMENT_TERMS_PRESETS.find(
      (p) => p.value.toLowerCase() === (value || "").toLowerCase(),
    ) || PAYMENT_TERMS_PRESETS.find((p) => p.value === "Net 30");

  // Calculate days offset between issueDate and dueDate
  const daysOffset = (() => {
    if (!issueDate || !dueDate) return 30;
    const start = new Date(issueDate);
    const end = new Date(dueDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return isNaN(diffDays) ? 30 : Math.max(0, diffDays);
  })();

  const handleSelectPreset = (preset) => {
    if (preset.value === "Custom") {
      onChange("Custom");
      setIsOpen(false);
      return;
    }

    onChange(preset.value);
    setIsOpen(false);

    if (issueDate && onDueDateChange) {
      const base = new Date(issueDate);
      base.setDate(base.getDate() + preset.days);
      onDueDateChange(base.toISOString().split("T")[0]);
    }
  };

  const handleApplyCustomDays = (numDays) => {
    const days = Math.max(0, parseInt(numDays, 10) || 0);
    setCustomDays(days);
    onChange(`Net ${days}`);
    if (issueDate && onDueDateChange) {
      const base = new Date(issueDate);
      base.setDate(base.getDate() + days);
      onDueDateChange(base.toISOString().split("T")[0]);
    }
  };

  const formatDisplayDate = (dStr) => {
    if (!dStr) return "-";
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-between mb-1">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] text-indigo-600 dark:text-indigo-400">
            schedule
          </span>
          <span>Payment Terms *</span>
        </span>
        {dueDate && (
          <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
            Due: {formatDisplayDate(dueDate)} ({daysOffset}d)
          </span>
        )}
      </label>

      {/* Stylish Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-3 py-2 text-xs rounded-lg border transition-all flex items-center justify-between cursor-pointer text-left shadow-2xs ${
          isOpen
            ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/40"
            : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#1b1d1e] hover:border-indigo-300 dark:hover:border-zinc-600 text-slate-900 dark:text-zinc-100"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px] shrink-0">
            {selectedPreset?.shortLabel === "Immediate"
              ? "0d"
              : `${daysOffset}d`}
          </div>
          <div className="truncate">
            <span className="font-semibold text-xs block truncate text-slate-900 dark:text-zinc-100">
              {value || "Net 30 Days"}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate">
              {selectedPreset?.description || `Due in ${daysOffset} days`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
            {selectedPreset?.badge || "Term"}
          </span>
          <span className="material-symbols-outlined text-base text-slate-400">
            {isOpen ? "expand_less" : "unfold_more"}
          </span>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white dark:bg-[#161718] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-2 space-y-1">
          {/* Quick Presets Grid */}
          <div className="grid grid-cols-2 gap-1.5 mb-1.5">
            {PAYMENT_TERMS_PRESETS.slice(0, 6).map((preset) => {
              const isSelected =
                (value || "").toLowerCase() === preset.value.toLowerCase();

              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2 rounded-lg text-left transition-all cursor-pointer flex items-center justify-between border ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-2xs font-semibold"
                      : "bg-white dark:bg-[#1a1b1d] border-slate-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-zinc-700 text-slate-800 dark:text-zinc-200"
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">
                      {preset.shortLabel}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                      {preset.days === 0 ? "Due today" : `+${preset.days} days`}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-sm text-indigo-600 dark:text-indigo-400 font-bold">
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Credit Days Input Stepper */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 px-1 py-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                Custom Days:
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="30"
                  className="w-16 px-2 py-1 text-xs text-center font-mono rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCustomDays(customDays)}
                  className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
