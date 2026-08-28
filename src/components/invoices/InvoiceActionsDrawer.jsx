import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  formatINR,
  formatInvoiceDate,
  getOverdueInfo,
  getDocumentTypeStyles,
  getDocumentStatusStyles,
  getPaymentStatusStyles,
} from "../../utils/invoiceStatus";
import {
  exportInvoiceToPdf,
  exportInvoiceToExcel,
  exportInvoiceToCsv,
} from "../../services/invoiceExportService";

export default function InvoiceActionsDrawer({
  open,
  onClose,
  invoice,
  customer,
  trip: _trip = null,
  onViewDetails,
  onRecordPayment,
  onIssueInvoice,
  onCancelInvoice,
  onDeleteInvoice,
  onNavigateToTrip,
}) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !invoice) {
    return null;
  }

  const docTypeStyles = getDocumentTypeStyles(invoice.documentType);
  const docStatus = getDocumentStatusStyles(invoice.documentStatus);
  const pmtStatus = getPaymentStatusStyles(invoice.paymentStatus);

  const overdueInfo = getOverdueInfo(
    invoice.dueDate,
    invoice.paymentStatus,
    invoice.documentStatus,
  );
  const isOverdue = overdueInfo.isOverdue;

  const total = Number(invoice.totalAmount || 0);
  const paid = Number(invoice.paidAmount || 0);
  const due = Math.max(0, total - paid);
  const paidPercent =
    total > 0 ? Math.min(100, Math.max(0, (paid / total) * 100)) : 0;

  const isDraft = invoice.documentStatus === "draft";
  const isCancelled = invoice.documentStatus === "cancelled";
  const isFullyPaid =
    invoice.paymentStatus === "paid" || (total > 0 && due === 0);

  const customerName = customer?.name || invoice.customerName || "Customer";
  const customerCode = invoice.customerCode || customer?.customerCode || "—";
  const customerGstin = invoice.customerGstin || customer?.gstin || "—";
  const customerContact =
    customer?.phone || customer?.mobile || customer?.email;

  const isConsolidated = Boolean(invoice.isConsolidated);
  const consolidatedCount = invoice.consolidatedTripsCount || 1;
  const tripReference = isConsolidated
    ? `Consolidated (${consolidatedCount} Trips)`
    : invoice.tripCode || "Direct Bill";

  const handleCopySummary = () => {
    const summary = [
      `Invoice: ${invoice.invoiceNumber}`,
      `Document Type: ${docTypeStyles.label || "Tax Invoice"}`,
      `Customer: ${customerName} (${customerCode})`,
      customerGstin !== "—" ? `GSTIN: ${customerGstin}` : null,
      `Trip/Route: ${tripReference} — ${invoice.route || "Point to Point Transit"}`,
      `Issue Date: ${formatInvoiceDate(invoice.issueDate)}`,
      invoice.dueDate
        ? `Due Date: ${formatInvoiceDate(invoice.dueDate)}`
        : null,
      `Total Amount: ₹${total.toLocaleString("en-IN")}`,
      `Paid Amount: ₹${paid.toLocaleString("en-IN")}`,
      `Balance Due: ₹${due.toLocaleString("en-IN")}`,
      `Document Status: ${docStatus.label}`,
      !isDraft ? `Payment Status: ${pmtStatus.label}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleExportPdf = () => {
    try {
      setIsExporting(true);
      exportInvoiceToPdf(invoice);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    try {
      setIsExporting(true);
      exportInvoiceToExcel(invoice);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = () => {
    try {
      setIsExporting(true);
      exportInvoiceToCsv(invoice);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Invoice Actions Drawer"
      data-testid="invoice-actions-drawer"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div className="w-screen max-w-md transform bg-white dark:bg-[#161822] text-slate-900 dark:text-slate-100 shadow-2xl border-l border-slate-200 dark:border-[#262837] flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#13151f] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-[#a078ff] shrink-0">
                <span className="material-symbols-outlined text-[18px]">
                  receipt_long
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                    {invoice.invoiceNumber}
                  </span>
                  {docTypeStyles.label && (
                    <span
                      className={[
                        "text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full shrink-0",
                        docTypeStyles.badge ||
                          "bg-slate-200 dark:bg-[#202330] text-slate-700 dark:text-slate-300",
                      ].join(" ")}
                    >
                      {docTypeStyles.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Invoice Actions & Operations
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close actions drawer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-[#1f2230] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Snapshot Card */}
            <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-slate-50/50 dark:bg-[#13151f] p-3.5 space-y-3">
              {/* Customer & GSTIN */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Billed To
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                  {customerName}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-1 flex-wrap">
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    Code: {customerCode}
                  </span>
                  {customerGstin !== "—" && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">
                        •
                      </span>
                      <span className="font-mono text-slate-600 dark:text-slate-300">
                        GSTIN: {customerGstin}
                      </span>
                    </>
                  )}
                  {customerContact && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">
                        •
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 truncate">
                        {customerContact}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Status Badges Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/80 dark:border-[#262837]">
                {/* Document status badge */}
                <span
                  className={[
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono",
                    docStatus.pill,
                  ].join(" ")}
                >
                  {docStatus.dot && (
                    <span
                      className={[
                        "w-1.5 h-1.5 rounded-full",
                        docStatus.dot,
                      ].join(" ")}
                    />
                  )}
                  <span>{docStatus.label}</span>
                </span>

                {/* Payment status badge (for non-draft) */}
                {!isDraft && (
                  <span
                    className={[
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono",
                      pmtStatus.pill,
                    ].join(" ")}
                  >
                    {pmtStatus.dot && (
                      <span
                        className={[
                          "w-1.5 h-1.5 rounded-full",
                          pmtStatus.dot,
                        ].join(" ")}
                      />
                    )}
                    <span>{pmtStatus.label}</span>
                  </span>
                )}

                {/* Overdue alert badge */}
                {isOverdue && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold font-mono bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 animate-pulse">
                    <span className="material-symbols-outlined text-[13px]">
                      error
                    </span>
                    <span>OVERDUE</span>
                  </span>
                )}
              </div>

              {/* Trip Reference & Route */}
              <div className="pt-1 text-xs border-t border-slate-200/80 dark:border-[#262837]">
                <div className="text-[11px] text-slate-400 block mb-0.5">
                  Trip Reference & Route
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  <span className="material-symbols-outlined text-[15px] text-indigo-600 dark:text-[#a078ff] shrink-0">
                    {isConsolidated ? "inventory_2" : "alt_route"}
                  </span>
                  <span className="font-mono font-semibold">
                    {tripReference}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="truncate">
                    {invoice.route || "Point to Point Transit"}
                  </span>
                </div>
              </div>

              {/* Financial & Dates Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs border-t border-slate-200/80 dark:border-[#262837]">
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    Issue Date
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatInvoiceDate(invoice.issueDate)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    Due Date
                  </span>
                  <span
                    className={[
                      "font-semibold",
                      isOverdue
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-slate-800 dark:text-slate-200",
                    ].join(" ")}
                  >
                    {isDraft ? "—" : formatInvoiceDate(invoice.dueDate)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    Total Amount
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {formatINR(total)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    Balance Due
                  </span>
                  <span
                    className={[
                      "font-mono font-bold",
                      isOverdue
                        ? "text-rose-600 dark:text-rose-400"
                        : isFullyPaid
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-900 dark:text-slate-100",
                    ].join(" ")}
                  >
                    {formatINR(due)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              {!isDraft && !isCancelled && total > 0 && (
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                    <span>Payment Progress</span>
                    <span>
                      {isFullyPaid
                        ? "100% Paid"
                        : `${Math.round(paidPercent)}% (${formatINR(paid, { compact: true })} paid)`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#1f2230] overflow-hidden">
                    <div
                      className={[
                        "h-full rounded-full transition-all duration-300",
                        isFullyPaid
                          ? "bg-emerald-500"
                          : isOverdue
                            ? "bg-rose-500"
                            : "bg-[#8b5cf6] dark:bg-[#d0bcff]",
                      ].join(" ")}
                      style={{ width: `${paidPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Primary Lifecycle Action Hero Section */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Recommended Next Step
              </h4>

              {/* 1. Draft -> Issue Invoice */}
              {isDraft && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onIssueInvoice?.(invoice);
                  }}
                  className="w-full p-3 rounded-xl border border-indigo-300 dark:border-indigo-700/60 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">
                        send
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-sm">Issue Tax Invoice</div>
                      <div className="text-xs text-indigo-100 opacity-90">
                        Mark official, lock items & generate tax document
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] transform group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              )}

              {/* 2. Issued & Unpaid / Partially Paid -> Record Payment */}
              {!isDraft && !isCancelled && !isFullyPaid && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRecordPayment?.(invoice);
                  }}
                  className="w-full p-3 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">
                        payments
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-sm">Record Payment</div>
                      <div className="text-xs text-emerald-100 opacity-90">
                        Log customer receipt ({formatINR(due)} balance due)
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] transform group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              )}

              {/* 3. Fully Paid -> Download Receipt / Tax Invoice */}
              {isFullyPaid && !isCancelled && (
                <button
                  type="button"
                  onClick={() => {
                    handleExportPdf();
                  }}
                  className="w-full p-3 rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-100/80 transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">
                        check_circle
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-sm">
                        Invoice Fully Settled
                      </div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-300">
                        Download settled PDF tax invoice receipt
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-emerald-600 transform group-hover:translate-x-1 transition-transform">
                    file_download
                  </span>
                </button>
              )}

              {/* 4. Cancelled Notice */}
              {isCancelled && (
                <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 text-xs">
                  <div className="font-bold flex items-center gap-1.5 mb-0.5">
                    <span className="material-symbols-outlined text-[16px]">
                      cancel
                    </span>
                    Invoice Cancelled
                  </div>
                  {invoice.cancelReason
                    ? `Reason: ${invoice.cancelReason}`
                    : "This invoice was voided/cancelled."}
                </div>
              )}
            </div>

            {/* General Invoice Operations */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Invoice Operations
              </h4>

              <div className="rounded-xl border border-slate-200 dark:border-[#262837] divide-y divide-slate-100 dark:divide-[#262837] overflow-hidden bg-white dark:bg-[#161822]">
                {/* 1. View Full Details */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewDetails?.(invoice);
                  }}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1a1c28] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-slate-500 dark:text-slate-400">
                      visibility
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        View Full Invoice Details
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Itemized billable line items, taxes & ledger history
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">
                    chevron_right
                  </span>
                </button>

                {/* 2. Record Payment (if applicable) */}
                {!isDraft && !isCancelled && !isFullyPaid && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRecordPayment?.(invoice);
                    }}
                    className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1a1c28] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">
                        payments
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          Record Payment
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Add payment receipt, TDS & settlement info
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">
                      chevron_right
                    </span>
                  </button>
                )}

                {/* 3. Export PDF */}
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExporting}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1a1c28] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-rose-500 dark:text-rose-400">
                      picture_as_pdf
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Export as PDF Document
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Official printable GST tax invoice layout
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">
                    file_download
                  </span>
                </button>

                {/* 4. Export Excel */}
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1a1c28] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">
                      table_view
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Export as Excel Workbook
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Spreadsheet format with calculations & taxes
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">
                    file_download
                  </span>
                </button>

                {/* 5. Export CSV */}
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={isExporting}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1a1c28] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-sky-600 dark:text-sky-400">
                      csv
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Export as CSV File
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Flat tabular data for ERP / accounting imports
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">
                    file_download
                  </span>
                </button>

                {/* 6. Copy Invoice Summary */}
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1a1c28] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-slate-500 dark:text-slate-400">
                      {copied ? "check" : "content_copy"}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>Copy Invoice Summary</span>
                        {copied && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            Copied!
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Copy billing, dates & balance due to clipboard
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">
                    chevron_right
                  </span>
                </button>

                {/* 7. Print Tax Invoice */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1a1c28] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-slate-500 dark:text-slate-400">
                      print
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Print Tax Invoice
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Print physical copy via browser print dialog
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">
                    chevron_right
                  </span>
                </button>

                {/* 8. Associated Trip Navigation (if trip exists) */}
                {onNavigateToTrip && (invoice.tripId || invoice.tripCode) && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToTrip(invoice);
                    }}
                    className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1a1c28] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-indigo-600 dark:text-[#a078ff]">
                        directions_car
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          View Associated Trip ({invoice.tripCode})
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Navigate to trip dispatch & booking details
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">
                      chevron_right
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Danger Zone: Cancellation & Removal */}
            {!isCancelled && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2">
                  Cancellation & Removal
                </h4>

                <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 divide-y divide-rose-100 dark:divide-rose-950/60 overflow-hidden bg-rose-50/20 dark:bg-rose-950/10">
                  {/* Cancel Invoice */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onCancelInvoice?.(invoice);
                    }}
                    className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-rose-100/40 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-rose-700 dark:text-rose-400"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px]">
                        cancel
                      </span>
                      <div>
                        <div className="text-xs font-semibold">
                          Cancel Invoice
                        </div>
                        <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                          Void this invoice and zero out pending balances
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px]">
                      chevron_right
                    </span>
                  </button>

                  {/* Delete Draft Invoice */}
                  {isDraft && onDeleteInvoice && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onDeleteInvoice?.(invoice);
                      }}
                      className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-rose-100/40 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-rose-700 dark:text-rose-400"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[18px]">
                          delete_forever
                        </span>
                        <div>
                          <div className="text-xs font-semibold">
                            Delete Draft Invoice
                          </div>
                          <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                            Permanently remove this unissued draft
                          </div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[16px]">
                        chevron_right
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#13151f] flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400 font-mono">
              Invoice Ref:{" "}
              {invoice.id ? invoice.id.slice(0, 8) : invoice.invoiceNumber}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-[#262837] hover:bg-slate-200/60 dark:hover:bg-[#1f2230] text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
