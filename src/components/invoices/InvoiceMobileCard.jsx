import { useState, useRef, useEffect } from "react";
import {
  formatINR,
  formatInvoiceDate,
  getOverdueInfo,
  getDocumentTypeStyles,
} from "../../utils/invoiceStatus";
import {
  exportInvoiceToPdf,
  exportInvoiceToExcel,
  exportInvoiceToCsv,
} from "../../services/invoiceExportService";

export default function InvoiceMobileCard({
  invoice,
  onViewInvoice,
  onRecordPayment,
  onIssueInvoice,
  onCancelInvoice,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const overdueInfo = getOverdueInfo(
    invoice.dueDate,
    invoice.paymentStatus,
    invoice.documentStatus,
  );
  const isOverdue = overdueInfo.isOverdue;
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

  // Trip and Route presentation
  const isConsolidated = Boolean(invoice.isConsolidated);
  const consolidatedCount = invoice.consolidatedTripsCount || 1;
  const tripReference = isConsolidated
    ? `Consolidated (${consolidatedCount} Trips)`
    : invoice.tripCode || "Direct Bill";

  return (
    <div
      onClick={() => onViewInvoice && onViewInvoice(invoice)}
      className="group relative rounded-xl border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#121314] p-4 sm:p-5 flex flex-col gap-3 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all cursor-pointer select-none"
    >
      {/* Top Row: Invoice Number + Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-sm tracking-tight text-slate-900 dark:text-zinc-100">
            {invoice.invoiceNumber}
          </span>
          {docTypeStyles.label && (
            <span
              className={[
                "text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400",
                docTypeStyles.badge,
              ].join(" ")}
            >
              {docTypeStyles.label}
            </span>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {/* Overdue Badge (Stitch style) */}
          {isOverdue ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wide bg-rose-50 dark:bg-[#2a1215] text-rose-600 dark:text-[#ff858d] border border-rose-200 dark:border-rose-900/60">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>• OVERDUE</span>
            </span>
          ) : isDraft ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
              <span>• DRAFT</span>
            </span>
          ) : isCancelled ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 line-through">
              <span>• CANCELLED</span>
            </span>
          ) : isFullyPaid ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wide bg-emerald-50 dark:bg-[#0e2617] text-emerald-700 dark:text-[#4ade80] border border-emerald-200 dark:border-emerald-900/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>• PAID</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wide bg-indigo-50 dark:bg-[#1e1730] text-indigo-700 dark:text-[#a078ff] border border-indigo-200 dark:border-indigo-900/60">
              <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-[#a078ff]" />
              <span>
                •{" "}
                {invoice.paymentStatus === "partially_paid"
                  ? "PARTIAL"
                  : "ISSUED"}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Customer Name & Code */}
      <div className="flex flex-col">
        <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100 tracking-tight leading-snug">
          {invoice.customerName}
        </h3>
        {invoice.customerCode ? (
          <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
            {invoice.customerCode}
          </span>
        ) : (
          <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 mt-0.5">
            —
          </span>
        )}
      </div>

      {/* Trip / Route Row (Stitch style) */}
      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-300">
        <span className="material-symbols-outlined text-[16px] text-slate-400 dark:text-zinc-500 shrink-0">
          alt_route
        </span>
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400 shrink-0">
            {tripReference}
          </span>
          {invoice.route ? (
            <>
              <span className="text-slate-300 dark:text-zinc-600">•</span>
              <span className="truncate font-medium text-slate-700 dark:text-zinc-200">
                {invoice.route}
              </span>
            </>
          ) : (
            <>
              <span className="text-slate-300 dark:text-zinc-600">•</span>
              <span className="text-slate-400 dark:text-zinc-500">—</span>
            </>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 dark:border-[#27272a] my-0.5" />

      {/* Financials Row (Stitch style) */}
      <div className="grid grid-cols-2 gap-3 items-end">
        {/* Total Amount */}
        <div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block mb-0.5">
            Total Amount
          </span>
          <div className="text-base sm:text-lg font-mono font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
            {formatINR(total)}
          </div>
          <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
            {isFullyPaid
              ? "Fully Paid"
              : paid > 0
                ? `${formatINR(paid, { compact: true })} paid · ${formatINR(due, { compact: true })} due`
                : "Unpaid"}
          </div>
        </div>

        {/* Balance Due */}
        <div className="text-right">
          <span
            className={[
              "text-[11px] font-medium block mb-0.5",
              isOverdue
                ? "text-rose-600 dark:text-rose-400 font-semibold"
                : "text-slate-500 dark:text-zinc-400",
            ].join(" ")}
          >
            Balance Due
          </span>
          <div
            className={[
              "text-base sm:text-lg font-mono font-bold tracking-tight",
              isOverdue
                ? "text-rose-600 dark:text-[#ff7b84]"
                : isFullyPaid
                  ? "text-emerald-600 dark:text-[#4ade80]"
                  : "text-slate-900 dark:text-zinc-100",
            ].join(" ")}
          >
            {formatINR(due)}
          </div>
          {/* Due date / Overdue label */}
          <div className="mt-0.5">
            {isOverdue ? (
              <span className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400">
                {overdueInfo.text ||
                  `Due ${formatInvoiceDate(invoice.dueDate)}`}
              </span>
            ) : invoice.dueDate ? (
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                Due: {formatInvoiceDate(invoice.dueDate)}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                Immediate
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar (if active & not fully paid) */}
      {!isDraft && !isCancelled && total > 0 && (
        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden mt-0.5">
          <div
            className={[
              "h-full rounded-full transition-all duration-300",
              isFullyPaid
                ? "bg-emerald-500"
                : isOverdue
                  ? "bg-rose-500"
                  : "bg-indigo-600 dark:bg-[#a078ff]",
            ].join(" ")}
            style={{ width: `${paidPercent}%` }}
          />
        </div>
      )}

      {/* Actions Row (Stitch style) */}
      <div className="flex items-center gap-2 pt-1 mt-1">
        {/* Record Payment Button if active & unpaid */}
        {!isDraft && !isCancelled && !isFullyPaid && onRecordPayment && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRecordPayment(invoice);
            }}
            className="py-2.5 px-3 text-xs font-semibold rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">
              payments
            </span>
            <span>Record Payment</span>
          </button>
        )}

        {/* Primary View Details Button (Stitch style: Violet box) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewInvoice && onViewInvoice(invoice);
          }}
          className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-[#d0bcff] dark:hover:bg-[#c2abfc] dark:text-[#1e004d] transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>View Details</span>
          <span className="material-symbols-outlined text-[15px]">
            arrow_forward
          </span>
        </button>

        {/* Three-Dot Contextual Menu Trigger */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label={`More actions for ${invoice.invoiceNumber}`}
            aria-expanded={isMenuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-2.5 rounded-lg border border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#191a1c] hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-all flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              more_vert
            </span>
          </button>

          {/* Contextual Popup Menu */}
          {isMenuOpen && (
            <div
              className="absolute right-0 bottom-full mb-2 w-48 rounded-xl bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#27272a] shadow-xl p-1.5 z-30 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 1. View Details */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onViewInvoice && onViewInvoice(invoice);
                }}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-left transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-slate-400">
                  visibility
                </span>
                <span>View Details</span>
              </button>

              {/* 2. Record Payment (if applicable) */}
              {!isDraft && !isCancelled && !isFullyPaid && onRecordPayment && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onRecordPayment(invoice);
                  }}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 text-left transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    payments
                  </span>
                  <span>Record Payment</span>
                </button>
              )}

              {/* 3. Issue Invoice (if draft) */}
              {isDraft && onIssueInvoice && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onIssueInvoice(invoice);
                  }}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg text-indigo-600 dark:text-[#a078ff] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2 text-left transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    send
                  </span>
                  <span>Issue Invoice</span>
                </button>
              )}

              {/* 4. Export Actions Divider & Submenu */}
              <div className="border-t border-slate-100 dark:border-zinc-800/80 my-1" />
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Export Invoice
              </div>

              <button
                type="button"
                onClick={async () => {
                  setIsMenuOpen(false);
                  await exportInvoiceToPdf(invoice);
                }}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-left transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-rose-500">
                  picture_as_pdf
                </span>
                <span>Export PDF (.pdf)</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setIsMenuOpen(false);
                  await exportInvoiceToExcel(invoice);
                }}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-left transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-500">
                  table_view
                </span>
                <span>Export Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  exportInvoiceToCsv(invoice);
                }}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-left transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-indigo-500">
                  csv
                </span>
                <span>Export CSV (.csv)</span>
              </button>

              <div className="border-t border-slate-100 dark:border-zinc-800/80 my-1" />

              {/* 5. Print */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  window.print();
                }}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-left transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-slate-400">
                  print
                </span>
                <span>Print Invoice</span>
              </button>

              {/* 5. Cancel Invoice (if not already cancelled) */}
              {!isCancelled && onCancelInvoice && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onCancelInvoice(invoice);
                  }}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-left transition-colors cursor-pointer border-t border-slate-100 dark:border-zinc-800/80 mt-0.5 pt-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    cancel
                  </span>
                  <span>Cancel Invoice</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
