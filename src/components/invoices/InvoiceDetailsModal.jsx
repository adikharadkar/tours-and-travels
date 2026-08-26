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
import { numberToWordsINR } from "../../utils/numberToWords";
import { calculateInvoiceTaxes } from "../../utils/taxCalculation";

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

  const amountInWords = numberToWordsINR(total);

  // Address formatting
  const addressParts = [
    invoice.customerBillingAddress ||
      invoice.customerAddress ||
      invoice.billingAddress,
    invoice.customerCity || invoice.billingCity || invoice.city,
    invoice.customerState || invoice.billingState || invoice.state,
    invoice.customerPinCode ||
      invoice.customerPincode ||
      invoice.billingPincode ||
      invoice.pinCode,
  ].filter(Boolean);

  const formattedAddress = addressParts.join(", ");

  const pan =
    invoice.customerPan ||
    (invoice.customerGstin && invoice.customerGstin.length >= 12
      ? invoice.customerGstin.substring(2, 12)
      : null);

  // Consolidated KM calculation if applicable
  const totalConsolidatedKm =
    invoice.isConsolidated && Array.isArray(invoice.trips)
      ? invoice.trips.reduce((sum, t) => sum + (Number(t.totalKm) || 0), 0)
      : invoice.totalKm;

  // Calculate tax breakdown (SGST + CGST / IGST)
  let computedTaxRows = [];
  if (Array.isArray(invoice.taxRows) && invoice.taxRows.length > 0) {
    computedTaxRows = invoice.taxRows;
  } else if (
    invoice.cgstAmount !== undefined &&
    invoice.sgstAmount !== undefined &&
    (Number(invoice.cgstAmount) > 0 || Number(invoice.sgstAmount) > 0)
  ) {
    const halfRate = invoice.taxRate
      ? (Number(invoice.taxRate) / 2).toFixed(0)
      : 9;
    computedTaxRows = [
      { name: `CGST (${halfRate}%)`, amount: Number(invoice.cgstAmount) },
      { name: `SGST (${halfRate}%)`, amount: Number(invoice.sgstAmount) },
    ];
  } else if (invoice.items && invoice.items.length > 0) {
    const taxRes = calculateInvoiceTaxes({
      items: invoice.items,
      customerGstin: invoice.customerGstin,
      customerState:
        invoice.customerState || invoice.billingState || invoice.state,
    });
    if (taxRes.taxRows && taxRes.taxRows.length > 0) {
      computedTaxRows = taxRes.taxRows;
    }
  }

  // Fallback if taxAmount or taxRate is provided but not computed above
  if (
    computedTaxRows.length === 0 &&
    (Number(invoice.taxAmount) > 0 || Number(invoice.taxRate) > 0)
  ) {
    const totalTax = Number(invoice.taxAmount || 0);
    const halfRate = invoice.taxRate
      ? (Number(invoice.taxRate) / 2).toFixed(0)
      : 9;
    const halfTax =
      totalTax > 0
        ? totalTax / 2
        : (Number(invoice.subtotal || invoice.totalAmount || 0) *
            (Number(invoice.taxRate) / 2)) /
          100;
    computedTaxRows = [
      { name: `CGST (${halfRate}%)`, amount: halfTax },
      { name: `SGST (${halfRate}%)`, amount: halfTax },
    ];
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal open={isModalOpen} onClose={onClose} className="max-w-5xl">
      {/* Top Header Banner */}
      <ModalHeader className="border-b border-border p-5 sm:p-6 bg-surface/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <ModalTitle className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {invoice.invoiceNumber}
              </ModalTitle>

              {/* Document Type Badge */}
              <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded bg-muted/20 text-foreground border border-border tracking-wider uppercase">
                {docTypeStyles.label.toUpperCase()}
              </span>

              {/* Document Status Pill */}
              <span
                className={[
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium",
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

              {/* Payment Status Pill */}
              {!isDraft && (
                <span
                  className={[
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium",
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

            <ModalDescription className="text-xs text-muted">
              {docTypeStyles.label} &bull; Created on{" "}
              {formatInvoiceDate(invoice.createdAt || invoice.issueDate)}
              {invoice.issuedAt && (
                <span>
                  {" "}
                  &bull; Issued {formatInvoiceDate(invoice.issuedAt)}
                </span>
              )}
            </ModalDescription>
          </div>

          {/* Header Quick Actions & Dates */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                DATE: {formatInvoiceDate(invoice.issueDate).toUpperCase()}
              </div>
              <div className="text-[11px] font-mono text-muted">
                DUE: {formatInvoiceDate(invoice.dueDate)}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrint}
                title="Print Invoice"
                className="p-2 rounded-lg border border-border text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  print
                </span>
              </button>
              <button
                type="button"
                onClick={onClose}
                title="Close"
                className="p-2 rounded-lg border border-border text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            </div>
          </div>
        </div>
      </ModalHeader>

      <ModalContent className="space-y-6 text-xs text-foreground p-5 sm:p-6 max-h-[72vh] overflow-y-auto pr-1">
        {/* Overdue alert banner if overdue */}
        {isOverdue && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between text-rose-800 dark:text-rose-300">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[22px] text-rose-600 dark:text-rose-400">
                error
              </span>
              <div>
                <span className="font-bold text-sm block">
                  Payment is Overdue
                </span>
                <span className="text-xs text-rose-600 dark:text-rose-400">
                  {overdueInfo.text} (Due Date:{" "}
                  {formatInvoiceDate(invoice.dueDate)})
                </span>
              </div>
            </div>
            <div className="font-mono font-bold text-base">
              {formatINR(due)} Due
            </div>
          </div>
        )}

        {/* 3-Column Context Grid (Billed To, Operational Context, Payment Summary) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: BILLED TO */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                  BILLED TO
                </span>
                {invoice.customerCode && (
                  <span className="font-mono text-[11px] text-muted">
                    Code: {invoice.customerCode}
                  </span>
                )}
              </div>

              <div className="mt-2.5">
                <h4 className="text-sm font-bold text-foreground">
                  {invoice.customerName}
                </h4>
                {formattedAddress && (
                  <p className="mt-1 text-xs text-muted leading-relaxed line-clamp-3">
                    {formattedAddress}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-border space-y-1 font-mono text-[11px]">
              {invoice.customerGstin ? (
                <div className="text-muted">GSTIN: {invoice.customerGstin}</div>
              ) : (
                <div className="text-muted">GSTIN: Unregistered</div>
              )}
              {pan && <div className="text-muted">PAN: {pan}</div>}
              {invoice.contactPerson && (
                <div className="text-muted font-sans text-xs">
                  Attn: {invoice.contactPerson}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: OPERATIONAL CONTEXT */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                  OPERATIONAL CONTEXT
                </span>
                {invoice.isConsolidated ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                    {invoice.consolidatedTripsCount ||
                      (invoice.trips ? invoice.trips.length : 1)}{" "}
                    Trips
                  </span>
                ) : (
                  <span className="font-mono text-[11px] font-semibold text-foreground">
                    {invoice.tripCode || "Direct Charge"}
                  </span>
                )}
              </div>

              <div className="mt-2.5 space-y-2 text-xs">
                {invoice.isConsolidated ? (
                  <>
                    <div className="flex items-center justify-between text-muted">
                      <span>Type:</span>
                      <span className="font-semibold text-foreground">
                        Consolidated Fleet Batch
                      </span>
                    </div>
                    {invoice.consolidatedPeriod && (
                      <div className="flex items-center justify-between text-muted">
                        <span>Period:</span>
                        <span className="font-medium text-foreground">
                          {invoice.consolidatedPeriod}
                        </span>
                      </div>
                    )}
                    {totalConsolidatedKm ? (
                      <div className="flex items-center justify-between text-muted">
                        <span>Total Mileage:</span>
                        <span className="font-mono font-semibold text-foreground">
                          {totalConsolidatedKm} KM
                        </span>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-muted">Route:</span>
                      <div className="font-semibold text-foreground">
                        {invoice.route || "Standard Transportation Service"}
                      </div>
                    </div>
                    {invoice.vehicleNumber && (
                      <div className="flex items-center justify-between text-muted">
                        <span>Vehicle:</span>
                        <span className="font-mono font-semibold text-foreground">
                          {invoice.vehicleNumber}
                        </span>
                      </div>
                    )}
                    {invoice.driverName && (
                      <div className="flex items-center justify-between text-muted">
                        <span>Driver:</span>
                        <span className="font-medium text-foreground">
                          {invoice.driverName}
                        </span>
                      </div>
                    )}
                    {invoice.totalKm && (
                      <div className="flex items-center justify-between text-muted">
                        <span>Distance:</span>
                        <span className="font-mono font-semibold text-foreground">
                          {invoice.totalKm} KM
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] font-mono text-muted">
              <span>Terms:</span>
              <span className="font-semibold text-foreground font-sans">
                {invoice.paymentTerms || "30 Days"}
              </span>
            </div>
          </div>

          {/* Column 3: PAYMENT SUMMARY */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                  PAYMENT SUMMARY
                </span>
                <span className="font-mono text-[10px] text-muted">
                  DUE {formatInvoiceDate(invoice.dueDate)}
                </span>
              </div>

              <div className="mt-2.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-muted">
                  <span>Total Billed:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatINR(total)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Amount Paid:</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatINR(paid)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted font-bold block">
                Outstanding Balance
              </span>
              <div
                className={[
                  "font-mono text-xl sm:text-2xl font-bold tracking-tight",
                  due > 0
                    ? isOverdue
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-foreground"
                    : "text-emerald-600 dark:text-emerald-400",
                ].join(" ")}
              >
                {formatINR(due)}
              </div>

              <div className="text-[11px] font-medium pt-0.5">
                {isFullyPaid ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      check_circle
                    </span>
                    Paid in Full
                  </span>
                ) : isOverdue ? (
                  <span className="text-rose-600 dark:text-rose-400">
                    {overdueInfo.text}
                  </span>
                ) : (
                  <span className="text-muted">
                    Due in {formatInvoiceDate(invoice.dueDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Consolidated Trips Sub-Table if Consolidated Invoice */}
        {invoice.isConsolidated &&
          Array.isArray(invoice.trips) &&
          invoice.trips.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
                  Consolidated Trips ({invoice.trips.length} Movements)
                </span>
                <span className="text-xs text-muted">
                  Included in this billing batch
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface text-[10px] font-mono uppercase tracking-wider text-muted">
                      <th className="py-2.5 px-3">Trip Code</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Route & Vehicle</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {invoice.trips.map((t, idx) => (
                      <tr
                        key={t.id || idx}
                        className="hover:bg-surface-hover transition-colors"
                      >
                        <td className="py-2.5 px-3 font-bold text-foreground">
                          {t.tripCode}
                        </td>
                        <td className="py-2.5 px-3 text-muted">
                          {t.date || "—"}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-foreground">
                          <div className="font-medium">{t.route}</div>
                          {t.vehicleNumber && (
                            <div className="text-[11px] text-muted font-mono">
                              {t.vehicleNumber}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-foreground">
                          {formatINR(t.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* Line Items Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
              Line Items & Charges
            </span>
            <span className="text-[11px] font-mono text-muted">
              {invoice.items?.length || 1} Item(s)
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface text-[10px] font-mono uppercase tracking-wider text-muted">
                  <th className="py-2.5 px-3 w-10">#</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-3 text-center w-20">Qty</th>
                  <th className="py-2.5 px-3 text-right w-28">Rate</th>
                  <th className="py-2.5 px-4 text-right w-32">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-surface-hover transition-colors"
                    >
                      <td className="py-3 px-3 font-mono text-muted text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">
                          {item.description}
                        </div>
                        {item.subtitle && (
                          <div className="text-[11px] text-muted mt-0.5">
                            {item.subtitle}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-muted font-mono">
                        {item.quantity || 1}
                      </td>
                      <td className="py-3 px-3 text-right text-muted font-mono">
                        {formatINR(item.unitRate || item.rate || item.amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                        {Number(item.amount || 0) < 0 ? "-" : ""}
                        {formatINR(Math.abs(item.amount || 0))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="hover:bg-surface-hover transition-colors">
                    <td className="py-3 px-3 font-mono text-muted text-[11px]">
                      1
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {invoice.route || "Transport Freight Service"}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-muted">
                      1
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-muted">
                      {formatINR(invoice.subtotal || invoice.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                      {formatINR(invoice.subtotal || invoice.totalAmount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Financial Summary & Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Left Column: Words, Notes, and Payment History */}
          <div className="space-y-4">
            {/* Amount in Words */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                AMOUNT IN WORDS
              </span>
              <p className="italic text-xs text-foreground font-medium">
                {amountInWords}
              </p>
            </div>

            {/* Remarks / Instructions */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                Remarks & Instructions
              </span>
              <p className="text-xs text-muted leading-relaxed">
                {invoice.notes ||
                  "Standard transportation freight contract. Subject to local state jurisdiction. All cheques / transfers payable to FleetCore Logistics."}
              </p>
            </div>

            {/* Payment Receipts timeline if payment history exists */}
            {invoice.paymentHistory && invoice.paymentHistory.length > 0 && (
              <div className="space-y-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted block">
                  Payment Receipts ({invoice.paymentHistory.length})
                </span>
                <div className="space-y-2">
                  {invoice.paymentHistory.map((pmt, index) => (
                    <div
                      key={pmt.id || index}
                      className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">
                          check_circle
                        </span>
                        <div>
                          <span className="font-mono font-bold text-foreground">
                            {formatINR(pmt.amount)}
                          </span>
                          <span className="text-[11px] text-muted ml-2">
                            via{" "}
                            {pmt.paymentMode?.replace("_", " ").toUpperCase() ||
                              "BANK TRANSFER"}
                          </span>
                          {pmt.referenceNumber && (
                            <span className="text-[11px] font-mono text-muted ml-2 block sm:inline">
                              Ref: {pmt.referenceNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-[11px] text-muted font-mono">
                        {formatInvoiceDate(pmt.paymentDate || pmt.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Financial Totals Breakdown */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 font-mono text-xs flex flex-col justify-between">
            <div className="space-y-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted block border-b border-border pb-2">
                TAX & CHARGE BREAKDOWN
              </span>

              <div className="flex justify-between text-muted pt-1">
                <span>Subtotal:</span>
                <span className="font-semibold text-foreground">
                  {formatINR(invoice.subtotal || invoice.totalAmount)}
                </span>
              </div>

              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount:</span>
                  <span>-{formatINR(invoice.discountAmount)}</span>
                </div>
              )}

              {computedTaxRows.length > 0 &&
                computedTaxRows.map((t, idx) => (
                  <div key={idx} className="flex justify-between text-muted">
                    <span>{t.name}:</span>
                    <span className="font-semibold text-foreground">
                      {formatINR(t.amount)}
                    </span>
                  </div>
                ))}

              {invoice.roundOff && invoice.roundOff !== 0 && (
                <div className="flex justify-between text-muted">
                  <span>Round Off:</span>
                  <span className="font-semibold text-foreground">
                    {invoice.roundOff > 0 ? "+" : ""}
                    {formatINR(invoice.roundOff)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-3 border-t border-border">
              <div className="flex justify-between items-center text-sm font-bold text-foreground">
                <span>Total Amount:</span>
                <span className="text-base text-primary font-bold">
                  {formatINR(total)}
                </span>
              </div>

              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs">
                <span>Paid to Date:</span>
                <span className="font-semibold">{formatINR(paid)}</span>
              </div>

              <div className="flex justify-between items-center font-bold text-foreground border-t border-dashed border-border pt-2">
                <span className="text-xs">Outstanding Due:</span>
                <span
                  className={[
                    "text-sm font-bold",
                    due > 0
                      ? isOverdue
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-foreground"
                      : "text-emerald-600 dark:text-emerald-400",
                  ].join(" ")}
                >
                  {formatINR(due)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ModalContent>

      {/* Footer Actions */}
      <ModalFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 sm:p-5 bg-surface/50">
        <div className="flex items-center gap-2">
          {/* Print button */}
          <Button
            type="button"
            variant="secondary"
            onClick={handlePrint}
            className="flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Print</span>
          </Button>

          {/* Cancel button if not already cancelled */}
          {!isCancelled && (
            <button
              type="button"
              onClick={() => {
                onCancelInvoice(invoice);
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              Cancel Invoice
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isDraft && (
            <Button
              type="button"
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
              type="button"
              variant="primary"
              onClick={() => {
                onClose();
                onRecordPayment(invoice);
              }}
            >
              Record Payment
            </Button>
          )}

          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
