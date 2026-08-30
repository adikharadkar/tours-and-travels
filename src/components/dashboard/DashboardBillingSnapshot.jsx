import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { formatINR } from "../../utils/invoiceStatus";

export default function DashboardBillingSnapshot({
  totalOutstanding = 0,
  overdueAmount = 0,
  overdueCount = 0,
  paidThisMonth = 0,
  transactionsThisMonth = 0,
  draftCount = 0,
  readyToInvoiceCount = 0,
}) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl bg-white dark:bg-[#18191b] border border-slate-200/90 dark:border-[#27272a] shadow-xs p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-[#27272a]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-400">
            <span className="material-symbols-outlined text-base">
              account_balance
            </span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              Billing Snapshot
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              High-level overview of active receivables, collections, and
              pending invoices
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate("/invoices")}
            className="text-xs h-7.5"
          >
            <span>Invoice Ledger</span>
            <span className="material-symbols-outlined text-xs">
              open_in_new
            </span>
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => navigate("/invoices/generate")}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] active:opacity-90 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0"
          >
            <span>+ Create Invoice</span>
          </Button>
        </div>
      </div>

      {/* 4-col Billing Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-4">
        {/* Total Outstanding */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/invoices?paymentStatus=unpaid")}
          className="p-3 sm:p-3.5 rounded-lg bg-slate-50 dark:bg-[#121314] border border-slate-200/80 dark:border-[#27272a] hover:border-indigo-500/30 transition-colors cursor-pointer"
        >
          <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
            Total Outstanding
          </span>
          <p className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-zinc-100 mt-1">
            {formatINR(totalOutstanding)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 block">
            Active receivables
          </span>
        </div>

        {/* Overdue */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/invoices?status=overdue")}
          className="p-3 sm:p-3.5 rounded-lg bg-slate-50 dark:bg-[#121314] border border-slate-200/80 dark:border-[#27272a] hover:border-amber-500/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Overdue
            </span>
            {overdueCount > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300">
                {overdueCount} inv
              </span>
            )}
          </div>
          <p className="text-lg sm:text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {formatINR(overdueAmount)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 block truncate">
            {overdueCount > 0
              ? "Requires collection follow-up"
              : "Zero overdue"}
          </span>
        </div>

        {/* Collected This Month */}
        <div
          role="button"
          tabIndex={0}
          onClick={() =>
            navigate("/invoices?paymentStatus=paid&date=this_month")
          }
          className="p-3 sm:p-3.5 rounded-lg bg-slate-50 dark:bg-[#121314] border border-slate-200/80 dark:border-[#27272a] hover:border-emerald-500/30 transition-colors cursor-pointer"
        >
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Paid This Month
          </span>
          <p className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatINR(paidThisMonth)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 block truncate">
            {transactionsThisMonth} cleared payments
          </span>
        </div>

        {/* Ready to Invoice / Drafts */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate("/trips?invoiceFilter=ready_to_invoice")}
          className="p-3 sm:p-3.5 rounded-lg bg-slate-50 dark:bg-[#121314] border border-slate-200/80 dark:border-[#27272a] hover:border-[#8455ef]/30 transition-colors cursor-pointer"
        >
          <span className="text-[11px] font-semibold text-purple-600 dark:text-[#d0bcff] uppercase tracking-wider block">
            Unbilled / Drafts
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg sm:text-xl font-bold text-purple-600 dark:text-[#d0bcff]">
              {readyToInvoiceCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              ready &bull; {draftCount} drafts
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 block truncate">
            Click to view ready trips
          </span>
        </div>
      </div>
    </div>
  );
}
