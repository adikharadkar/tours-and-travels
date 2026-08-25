import { formatINR } from "../../utils/invoiceStatus";

export default function InvoiceOverview({ kpis, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-md bg-white dark:bg-[#121314] border border-[#e2e8f0] dark:border-[#27272a] p-4 animate-pulse"
          >
            <div className="h-4 w-24 bg-slate-200 dark:bg-zinc-800 rounded mb-3" />
            <div className="h-7 w-36 bg-slate-200 dark:bg-zinc-800 rounded mb-2" />
            <div className="h-3 w-28 bg-slate-100 dark:bg-zinc-800/60 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const {
    totalOutstanding = 0,
    overdueAmount = 0,
    overdueCount = 0,
    draftCount = 0,
    paidThisMonth = 0,
    transactionsThisMonth = 0,
  } = kpis || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Outstanding */}
      <div className="relative rounded-md bg-white dark:bg-[#121314] border border-[#e2e8f0] dark:border-[#27272a] p-4 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 tracking-wide">
            Total Outstanding
          </span>
          <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-zinc-500">
            account_balance_wallet
          </span>
        </div>

        <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-zinc-100 mb-1">
          {formatINR(totalOutstanding)}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="material-symbols-outlined text-[14px]">
            trending_up
          </span>
          <span>+12% from last month</span>
        </div>
      </div>

      {/* 2. Overdue */}
      <div className="relative rounded-md bg-white dark:bg-[#121314] border border-[#e2e8f0] dark:border-[#27272a] p-4 transition-all duration-200 hover:border-rose-300 dark:hover:border-rose-900/50 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 tracking-wide">
            Overdue
          </span>
          <span className="material-symbols-outlined text-[18px] text-rose-500 dark:text-rose-400">
            warning
          </span>
        </div>

        <div className="text-2xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-500 mb-1">
          {formatINR(overdueAmount)}
        </div>

        <div className="text-xs text-rose-600 dark:text-rose-400/90 font-mono">
          {overdueCount} {overdueCount === 1 ? "Invoice" : "Invoices"} pending
        </div>
      </div>

      {/* 3. Drafts */}
      <div className="relative rounded-md bg-white dark:bg-[#121314] border border-[#e2e8f0] dark:border-[#27272a] p-4 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 tracking-wide">
            Drafts
          </span>
          <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-zinc-500">
            description
          </span>
        </div>

        <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-zinc-100 mb-1">
          {draftCount}
        </div>

        <div className="text-xs text-slate-500 dark:text-zinc-400">
          Awaiting approval
        </div>
      </div>

      {/* 4. Received This Month */}
      <div className="relative rounded-md bg-white dark:bg-[#121314] border border-[#e2e8f0] dark:border-[#27272a] p-4 transition-all duration-200 hover:border-slate-300 dark:hover:border-zinc-700 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 tracking-wide">
            Received This Month
          </span>
          <span className="material-symbols-outlined text-[18px] text-emerald-500 dark:text-emerald-400">
            payments
          </span>
        </div>

        <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-zinc-100 mb-1">
          {formatINR(paidThisMonth)}
        </div>

        <div className="text-xs text-slate-500 dark:text-zinc-400">
          Across {transactionsThisMonth}{" "}
          {transactionsThisMonth === 1 ? "transaction" : "transactions"}
        </div>
      </div>
    </div>
  );
}
