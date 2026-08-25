import {
  formatINR,
  formatInvoiceDate,
  getOverdueInfo,
  getDocumentStatusStyles,
  getPaymentStatusStyles,
  getDocumentTypeStyles,
} from "../../utils/invoiceStatus";

export default function InvoiceMobileCard({
  invoice,
  onViewInvoice,
  onRecordPayment,
}) {
  const docStatus = getDocumentStatusStyles(invoice.documentStatus);
  const overdueInfo = getOverdueInfo(
    invoice.dueDate,
    invoice.paymentStatus,
    invoice.documentStatus,
  );
  const isOverdue = overdueInfo.isOverdue;
  const pmtStatus = getPaymentStatusStyles(invoice.paymentStatus, isOverdue);
  const docTypeStyles = getDocumentTypeStyles(invoice.documentType);

  const total = Number(invoice.totalAmount || 0);
  const paid = Number(invoice.paidAmount || 0);
  const due = Math.max(0, total - paid);
  const paidPercent =
    total > 0 ? Math.min(100, Math.max(0, (paid / total) * 100)) : 0;

  const isDraft = invoice.documentStatus === "draft";
  const isCancelled = invoice.documentStatus === "cancelled";
  const isFullyPaid =
    invoice.paymentStatus === "paid" || (total > 0 && due === 0);

  return (
    <div
      onClick={() => onViewInvoice(invoice)}
      className="rounded-md border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#121314] p-4 flex flex-col gap-3 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
    >
      {/* Header Row: Invoice # + Document Type + Status Pills */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-sm tracking-tight">
            {invoice.invoiceNumber}
          </span>
          <span className={["text-xs", docTypeStyles.badge].join(" ")}>
            {docTypeStyles.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <span
            className={[
              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono",
              docStatus.pill,
            ].join(" ")}
          >
            {docStatus.dot && (
              <span
                className={["w-1.5 h-1.5 rounded-full", docStatus.dot].join(
                  " ",
                )}
              />
            )}
            <span>{docStatus.label}</span>
          </span>

          {!isDraft && (
            <span
              className={[
                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono",
                pmtStatus.pill,
              ].join(" ")}
            >
              {pmtStatus.dot && (
                <span
                  className={["w-1.5 h-1.5 rounded-full", pmtStatus.dot].join(
                    " ",
                  )}
                />
              )}
              <span>{pmtStatus.label}</span>
            </span>
          )}
        </div>
      </div>

      {/* Customer & Route Details */}
      <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 dark:border-zinc-800/80 py-2.5">
        <div>
          <span className="text-[10px] uppercase font-mono text-slate-400 dark:text-zinc-500 block">
            Customer
          </span>
          <span className="font-medium text-slate-900 dark:text-zinc-200 block truncate">
            {invoice.customerName}
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
            {invoice.customerCode || "—"}
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-mono text-slate-400 dark:text-zinc-500 block">
            Trip Reference
          </span>
          <span className="font-mono font-medium text-slate-800 dark:text-zinc-300 block">
            {invoice.isConsolidated
              ? `Consolidated (${invoice.consolidatedTripsCount || 1} Trips)`
              : invoice.tripCode || "Direct Bill"}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 block truncate">
            {invoice.route || "—"}
          </span>
        </div>
      </div>

      {/* Dates & Financials */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div>
          <div className="text-[11px] text-slate-500 dark:text-zinc-400">
            Issued: {formatInvoiceDate(invoice.issueDate)}
          </div>
          {isOverdue ? (
            <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">
                error
              </span>
              <span>{overdueInfo.text}</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 dark:text-zinc-400">
              Due: {formatInvoiceDate(invoice.dueDate)}
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-sm font-mono font-bold text-slate-900 dark:text-zinc-100">
            {formatINR(total)}
          </div>
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
            {isFullyPaid
              ? "Fully Paid"
              : paid > 0
                ? `${formatINR(paid, { compact: true })} paid · ${formatINR(due, { compact: true })} due`
                : "Unpaid"}
          </div>
        </div>
      </div>

      {/* Progress Bar (if active) */}
      {!isDraft && !isCancelled && total > 0 && (
        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={[
              "h-full rounded-full transition-all",
              isFullyPaid
                ? "bg-emerald-500"
                : isOverdue
                  ? "bg-rose-500"
                  : "bg-indigo-500",
            ].join(" ")}
            style={{ width: `${paidPercent}%` }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        {!isDraft && !isCancelled && !isFullyPaid && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRecordPayment(invoice);
            }}
            className="px-2.5 py-1 text-xs font-medium rounded border border-emerald-300 dark:border-emerald-700/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">
              payments
            </span>
            <span>Record Payment</span>
          </button>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewInvoice(invoice);
          }}
          className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">
            visibility
          </span>
          <span>View</span>
        </button>
      </div>
    </div>
  );
}
