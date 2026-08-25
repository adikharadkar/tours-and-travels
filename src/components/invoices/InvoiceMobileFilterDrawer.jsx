import { useEffect, useRef } from "react";
import {
  INVOICE_DOCUMENT_TYPES,
  PAYMENT_STATUSES,
  DOCUMENT_STATUSES,
  DATE_PRESET_OPTIONS,
} from "../../constants/invoices";

export default function InvoiceMobileFilterDrawer({
  isOpen,
  onClose,
  documentType,
  onDocumentTypeChange,
  paymentStatus,
  onPaymentStatusChange,
  documentStatus,
  onDocumentStatusChange,
  datePreset,
  onDatePresetChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  customerFilter,
  onCustomerFilterChange,
  customers = [],
  onResetFilters,
  activeFilterCount = 0,
  resultCount = 0,
}) {
  const drawerRef = useRef(null);

  // Close on ESC key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer content */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filter Invoices"
        className="relative z-10 w-full max-h-[85vh] bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 rounded-t-2xl border-t border-slate-200 dark:border-[#27272a] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
      >
        {/* Drag handle */}
        <div className="w-12 h-1 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-[#27272a]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-indigo-600 dark:text-[#a078ff]">
              tune
            </span>
            <h2 className="text-base font-bold tracking-tight">
              Filter Invoices
            </h2>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white dark:bg-[#a078ff] dark:text-[#1e004d] text-[10px] font-bold">
                {activeFilterCount} Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1 cursor-pointer"
              >
                Reset All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filter drawer"
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">
                close
              </span>
            </button>
          </div>
        </div>

        {/* Scrollable Filter Options */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(85vh-140px)]">
          {/* 1. Document Type */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-semibold block">
              Document Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {INVOICE_DOCUMENT_TYPES.map((type) => {
                const isSelected = documentType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => onDocumentTypeChange(type.value)}
                    className={[
                      "px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all cursor-pointer truncate",
                      isSelected
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-950/60 dark:border-[#a078ff] dark:text-[#d0bcff] font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-[#191a1c] dark:border-[#27272a] dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700",
                    ].join(" ")}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Payment Status */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-semibold block">
              Payment Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_STATUSES.map((status) => {
                const isSelected = paymentStatus === status.value;
                return (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => onPaymentStatusChange(status.value)}
                    className={[
                      "px-2.5 py-2 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer truncate",
                      isSelected
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-950/60 dark:border-[#a078ff] dark:text-[#d0bcff] font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-[#191a1c] dark:border-[#27272a] dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700",
                    ].join(" ")}
                  >
                    {status.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Document Status */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-semibold block">
              Document Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DOCUMENT_STATUSES.map((status) => {
                const isSelected = documentStatus === status.value;
                return (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => onDocumentStatusChange(status.value)}
                    className={[
                      "px-2.5 py-2 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer truncate",
                      isSelected
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-950/60 dark:border-[#a078ff] dark:text-[#d0bcff] font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-[#191a1c] dark:border-[#27272a] dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700",
                    ].join(" ")}
                  >
                    {status.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Customer Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-semibold block">
              Customer
            </label>
            <div className="relative">
              <select
                value={customerFilter}
                onChange={(e) => onCustomerFilterChange(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-lg border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#191a1c] text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none pr-8"
              >
                <option value="all" className="dark:bg-[#121314]">
                  All Customers
                </option>
                {customers.map((c) => (
                  <option
                    key={c.id || c.customerCode}
                    value={c.id || c.customerCode}
                    className="dark:bg-[#121314]"
                  >
                    {c.name} ({c.customerCode})
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-zinc-500 pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* 5. Date Range Presets */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-semibold block">
              Date Period
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DATE_PRESET_OPTIONS.map((opt) => {
                const isSelected = datePreset === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onDatePresetChange(opt.value)}
                    className={[
                      "px-2 py-2 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer truncate",
                      isSelected
                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-950/60 dark:border-[#a078ff] dark:text-[#d0bcff] font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-[#191a1c] dark:border-[#27272a] dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Range Picker */}
            {datePreset === "custom" && (
              <div className="grid grid-cols-2 gap-2 pt-2 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium">
                    Start Date
                  </span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => onCustomStartDateChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#191a1c] text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 block font-medium">
                    End Date
                  </span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => onCustomEndDateChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#191a1c] text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 dark:border-[#27272a] bg-slate-50/80 dark:bg-[#191a1c]/80 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onResetFilters();
              onClose();
            }}
            className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#121314] text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-[#a078ff] dark:hover:bg-[#8e5efc] dark:text-[#1e004d] shadow-sm transition-all cursor-pointer"
          >
            Apply Filters ({resultCount})
          </button>
        </div>
      </div>
    </div>
  );
}
