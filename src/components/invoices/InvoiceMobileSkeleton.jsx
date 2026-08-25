function InvoiceMobileSkeleton({ count = 3 }) {
  return (
    <div
      className="space-y-3 w-full"
      aria-label="Loading invoices"
      role="status"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#121314] p-4 flex flex-col gap-3 shadow-xs animate-pulse"
        >
          {/* Top Row: Invoice # + Status */}
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 bg-slate-200 dark:bg-zinc-800 rounded"></div>
            <div className="h-5 w-20 bg-slate-200 dark:bg-zinc-800 rounded"></div>
          </div>

          {/* Customer Name */}
          <div className="space-y-1">
            <div className="h-5 w-44 bg-slate-200 dark:bg-zinc-800 rounded"></div>
            <div className="h-3 w-20 bg-slate-100 dark:bg-zinc-800/60 rounded"></div>
          </div>

          {/* Route / Trip */}
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 bg-slate-200 dark:bg-zinc-800 rounded-full"></div>
            <div className="h-3.5 w-36 bg-slate-200 dark:bg-zinc-800 rounded"></div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 dark:border-zinc-800/80 my-1"></div>

          {/* Financials Row */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-5 w-24 bg-slate-200 dark:bg-zinc-800 rounded"></div>
            </div>
            <div className="space-y-1 text-right">
              <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded ml-auto"></div>
              <div className="h-5 w-20 bg-slate-200 dark:bg-zinc-800 rounded ml-auto"></div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <div className="h-9 flex-1 bg-slate-200 dark:bg-zinc-800 rounded-md"></div>
            <div className="h-9 w-10 bg-slate-200 dark:bg-zinc-800 rounded-md"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default InvoiceMobileSkeleton;
