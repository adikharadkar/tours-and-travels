import { useState, useRef, useEffect } from "react";
import {
  INVOICE_DOCUMENT_TYPES,
  PAYMENT_STATUSES,
  DOCUMENT_STATUSES,
  DATE_PRESET_OPTIONS,
} from "../../constants/invoices";

export default function InvoiceToolbar({
  documentType,
  onDocumentTypeChange,
  searchQuery,
  onSearchChange,
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
}) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    }
    if (isMoreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMoreOpen]);

  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* Top row: Document Type segmented buttons + Date Filter + More Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Document type segment selector (Stitch style) */}
        <div className="flex items-center p-1 rounded-md bg-slate-100 dark:bg-[#121314] border border-slate-200 dark:border-[#27272a] overflow-x-auto max-w-full">
          {INVOICE_DOCUMENT_TYPES.map((type) => {
            const isActive = documentType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => onDocumentTypeChange(type.value)}
                className={[
                  "px-3 py-1.5 text-xs font-medium rounded transition-all whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-white dark:bg-[#1f2021] text-slate-900 dark:text-zinc-100 shadow-xs font-semibold"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200",
                ].join(" ")}
              >
                {type.label}
              </button>
            );
          })}
        </div>

        {/* Right side: Date preset + More Filters */}
        <div
          className="flex items-center gap-2 relative ml-auto"
          ref={dropdownRef}
        >
          {/* Date preset selector */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-2.5 text-[16px] text-slate-400 dark:text-zinc-500 pointer-events-none">
              calendar_today
            </span>
            <select
              value={datePreset}
              onChange={(e) => onDatePresetChange(e.target.value)}
              aria-label="Date Range Filter"
              className="pl-8 pr-7 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-[#121314] border border-slate-200 dark:border-[#27272a] text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
            >
              {DATE_PRESET_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="dark:bg-[#1f2021]"
                >
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 text-[14px] text-slate-400 dark:text-zinc-500 pointer-events-none">
              expand_more
            </span>
          </div>

          {/* More Filters button */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            aria-expanded={isMoreOpen}
            aria-label="More Filters"
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all cursor-pointer",
              isMoreOpen || activeFilterCount > 0
                ? "bg-slate-100 dark:bg-[#1f2021] text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/50"
                : "bg-white dark:bg-[#121314] text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-[#27272a] hover:bg-slate-50 dark:hover:bg-[#1a1b1c]",
            ].join(" ")}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>More</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* More Filters Dropdown Menu */}
          {isMoreOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-md bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#27272a] shadow-xl p-4 z-40 flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
                <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                  Filter Invoices
                </span>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onResetFilters();
                      setIsMoreOpen(false);
                    }}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Reset all
                  </button>
                )}
              </div>

              {/* Payment Status Filter */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => onPaymentStatusChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option
                      key={status.value}
                      value={status.value}
                      className="dark:bg-[#1c1c1e]"
                    >
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Status Filter */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                  Document Status
                </label>
                <select
                  value={documentStatus}
                  onChange={(e) => onDocumentStatusChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {DOCUMENT_STATUSES.map((status) => (
                    <option
                      key={status.value}
                      value={status.value}
                      className="dark:bg-[#1c1c1e]"
                    >
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Filter */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                  Customer
                </label>
                <select
                  value={customerFilter}
                  onChange={(e) => onCustomerFilterChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all" className="dark:bg-[#1c1c1e]">
                    All Customers
                  </option>
                  {customers.map((c) => (
                    <option
                      key={c.id || c.customerCode}
                      value={c.id || c.customerCode}
                      className="dark:bg-[#1c1c1e]"
                    >
                      {c.name} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Date Range if Custom is selected */}
              {datePreset === "custom" && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 dark:text-zinc-400">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => onCustomStartDateChange(e.target.value)}
                      className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-800 dark:text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 dark:text-zinc-400">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => onCustomEndDateChange(e.target.value)}
                      className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-800 dark:text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(false)}
                  className="px-3 py-1 text-xs font-semibold rounded bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Second row: Search input + active filter tags */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-zinc-500 pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search by invoice #, customer, GSTIN, trip code, route..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-md bg-white dark:bg-[#121314] border border-slate-200 dark:border-[#27272a] text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                close
              </span>
            </button>
          )}
        </div>

        {/* Active filters pill list */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 dark:text-zinc-500 text-[11px]">
              Filtered by:
            </span>
            {paymentStatus !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1f2021] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#27272a]">
                Payment: {paymentStatus}
                <button
                  type="button"
                  onClick={() => onPaymentStatusChange("all")}
                  className="hover:text-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
            {documentStatus !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1f2021] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#27272a]">
                Doc: {documentStatus}
                <button
                  type="button"
                  onClick={() => onDocumentStatusChange("all")}
                  className="hover:text-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
            {customerFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1f2021] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#27272a]">
                Customer
                <button
                  type="button"
                  onClick={() => onCustomerFilterChange("all")}
                  className="hover:text-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-1"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
