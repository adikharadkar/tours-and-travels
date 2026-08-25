import Modal, {
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
} from "../ui/Modal";
import Button from "../ui/Button";
import {
  formatINR,
  formatInvoiceDate,
  getOverdueInfo,
  getDocumentStatusStyles,
  getPaymentStatusStyles,
  getDocumentTypeStyles,
} from "../../utils/invoiceStatus";

export default function InvoiceDetailsModal({
  isOpen,
  open,
  onClose,
  invoice,
  onRecordPayment,
  onIssueInvoice,
  onCancelInvoice,
}) {
  const isModalOpen = open !== undefined ? open : isOpen;
  if (!invoice || !isModalOpen) return null;

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

  const isDraft = invoice.documentStatus === "draft";
  const isCancelled = invoice.documentStatus === "cancelled";
  const isFullyPaid =
    invoice.paymentStatus === "paid" || (total > 0 && due === 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal open={isModalOpen} onClose={onClose} className="max-w-2xl">
      <ModalHeader>
        <div className="flex items-start justify-between gap-4 w-full pr-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <ModalTitle className="font-mono text-lg font-bold text-slate-900 dark:text-zinc-100">
                {invoice.invoiceNumber}
              </ModalTitle>

              <span
                className={[
                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-medium",
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
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-medium",
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
            </div>

            <ModalDescription className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {docTypeStyles.label} &bull; Created on{" "}
              {formatInvoiceDate(invoice.createdAt || invoice.issueDate)}
            </ModalDescription>
          </div>
        </div>
      </ModalHeader>

      <ModalContent className="space-y-5 text-xs text-slate-700 dark:text-zinc-300 max-h-[75vh] overflow-y-auto pr-1">
        {/* Overdue alert banner if overdue */}
        {isOverdue && (
          <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between text-rose-800 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-rose-600 dark:text-rose-400">
                warning
              </span>
              <div>
                <span className="font-semibold block">Payment is Overdue</span>
                <span className="text-[11px] text-rose-600 dark:text-rose-400">
                  {overdueInfo.text} (Due Date:{" "}
                  {formatInvoiceDate(invoice.dueDate)})
                </span>
              </div>
            </div>
            <div className="font-mono font-bold text-sm">
              {formatINR(due)} Due
            </div>
          </div>
        )}

        {/* Customer & Billing Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-md bg-slate-50 dark:bg-[#161719] border border-slate-200 dark:border-[#27272a]">
          {/* Customer info */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-zinc-500 font-semibold block">
              Billed To (Customer)
            </span>
            <div className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {invoice.customerName}
            </div>
            {invoice.customerCode && (
              <div className="text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                Code: {invoice.customerCode}
              </div>
            )}
            {invoice.customerGstin && (
              <div className="text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                GSTIN: {invoice.customerGstin}
              </div>
            )}
          </div>

          {/* Invoice Dates & Terms */}
          <div className="space-y-1 sm:text-right">
            <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-zinc-500 font-semibold block">
              Invoice Terms & Dates
            </span>
            <div>
              <span className="text-slate-500 dark:text-zinc-400">
                Issue Date:{" "}
              </span>
              <span className="font-medium text-slate-900 dark:text-zinc-100">
                {formatInvoiceDate(invoice.issueDate)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-zinc-400">
                Due Date:{" "}
              </span>
              <span className="font-medium text-slate-900 dark:text-zinc-100">
                {formatInvoiceDate(invoice.dueDate)}
              </span>
            </div>
            {invoice.paymentTerms && (
              <div>
                <span className="text-slate-500 dark:text-zinc-400">
                  Terms:{" "}
                </span>
                <span className="font-medium text-slate-900 dark:text-zinc-100">
                  {invoice.paymentTerms}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Trip Reference Section */}
        <div className="p-3 rounded-md bg-white dark:bg-[#121314] border border-slate-200 dark:border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[22px] text-indigo-500">
              {invoice.isConsolidated ? "inventory_2" : "route"}
            </span>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-zinc-500 block">
                Operation / Trip Reference
              </span>
              <div className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <span>
                  {invoice.tripCode ||
                    (invoice.isConsolidated
                      ? "Consolidated Contract"
                      : "Direct Operational Charge")}
                </span>
                {invoice.isConsolidated && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium">
                    {invoice.consolidatedTripsCount || 1} Trips
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                {invoice.route || "Point to Point Fleet Movement"}
              </div>
            </div>
          </div>

          {invoice.paymentReference && (
            <div className="text-left sm:text-right">
              <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-zinc-500 block">
                Payment Ref
              </span>
              <span className="font-mono text-xs text-slate-800 dark:text-zinc-300 font-medium">
                {invoice.paymentReference}
              </span>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div>
          <span className="text-xs font-semibold text-slate-900 dark:text-zinc-200 mb-2 block">
            Line Items & Charges
          </span>
          <div className="overflow-x-auto rounded border border-slate-200 dark:border-[#27272a]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#27272a] bg-slate-50 dark:bg-[#161719] text-[10px] font-mono uppercase text-slate-500 dark:text-zinc-500">
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-center w-16">Qty</th>
                  <th className="py-2 px-3 text-right w-24">Rate</th>
                  <th className="py-2 px-3 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-zinc-200">
                        {item.description}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 dark:text-zinc-400 font-mono">
                        {item.quantity || 1}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-zinc-400 font-mono">
                        {formatINR(item.unitRate || item.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-zinc-100">
                        {formatINR(item.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-zinc-200">
                      {invoice.route || "Transport Freight Service"}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">1</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {formatINR(invoice.subtotal || invoice.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">
                      {formatINR(invoice.subtotal || invoice.totalAmount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Calculation Summary */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2">
          {/* Notes */}
          <div className="flex-1 text-slate-500 dark:text-zinc-400 text-xs bg-slate-50 dark:bg-[#161719] p-3 rounded border border-slate-200 dark:border-[#27272a]">
            <span className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
              Remarks & Instructions
            </span>
            <p className="italic text-[11px] leading-relaxed">
              {invoice.notes ||
                "Standard transportation freight contract. Subject to local state jurisdiction."}
            </p>
          </div>

          {/* Totals Breakdown */}
          <div className="w-full sm:w-64 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-slate-600 dark:text-zinc-400">
              <span>Subtotal:</span>
              <span>{formatINR(invoice.subtotal || invoice.totalAmount)}</span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount:</span>
                <span>-{formatINR(invoice.discountAmount)}</span>
              </div>
            )}

            {invoice.taxRate > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span>GST ({invoice.taxRate}%):</span>
                <span>{formatINR(invoice.taxAmount || 0)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-zinc-100 border-t border-slate-200 dark:border-zinc-700 pt-1.5">
              <span>Total Amount:</span>
              <span>{formatINR(total)}</span>
            </div>

            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 pt-0.5">
              <span>Paid to Date:</span>
              <span>{formatINR(paid)}</span>
            </div>

            <div className="flex justify-between font-bold text-slate-900 dark:text-zinc-100 border-t border-dashed border-slate-200 dark:border-zinc-700 pt-1">
              <span>Outstanding Due:</span>
              <span
                className={
                  due > 0
                    ? "text-rose-600 dark:text-rose-400 font-bold"
                    : "text-emerald-600 dark:text-emerald-400"
                }
              >
                {formatINR(due)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History Timeline */}
        {invoice.paymentHistory && invoice.paymentHistory.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <span className="text-xs font-semibold text-slate-900 dark:text-zinc-200 block">
              Payment Receipts ({invoice.paymentHistory.length})
            </span>
            <div className="space-y-1.5">
              {invoice.paymentHistory.map((pmt, index) => (
                <div
                  key={pmt.id || index}
                  className="flex items-center justify-between p-2.5 rounded bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">
                      check_circle
                    </span>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">
                        {formatINR(pmt.amount)}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400 ml-2">
                        via{" "}
                        {pmt.paymentMode?.replace("_", " ").toUpperCase() ||
                          "BANK TRANSFER"}
                      </span>
                      {pmt.referenceNumber && (
                        <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 ml-2">
                          Ref: {pmt.referenceNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                    {formatInvoiceDate(pmt.paymentDate || pmt.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ModalContent>

      <ModalFooter className="flex items-center justify-between gap-2 border-t border-slate-200 dark:border-[#27272a] pt-3">
        <div className="flex items-center gap-2">
          {/* Print/Download button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Print</span>
          </button>

          {/* Cancel button if not already cancelled */}
          {!isCancelled && (
            <button
              type="button"
              onClick={() => {
                onCancelInvoice(invoice);
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
            >
              Cancel Invoice
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isDraft && (
            <Button
              variant="primary"
              onClick={() => {
                onIssueInvoice(invoice);
                onClose();
              }}
            >
              Issue Invoice
            </Button>
          )}

          {!isDraft && !isCancelled && !isFullyPaid && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onRecordPayment(invoice);
              }}
            >
              Record Payment
            </Button>
          )}

          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
