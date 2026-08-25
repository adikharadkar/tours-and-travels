import Modal, {
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  ModalClose,
} from "../ui/Modal";
import Button from "../ui/Button";
import { formatInvoiceDate } from "../../utils/invoiceStatus";
import { numberToWordsINR } from "../../utils/numberToWords";
import {
  DEFAULT_COMPANY_GSTIN,
  DEFAULT_COMPANY_STATE_NAME,
} from "../../utils/taxCalculation";

export default function InvoicePreviewModal({
  open,
  onClose,
  invoiceNumber,
  customer,
  trip,
  vehicle,
  driver,
  issueDate,
  dueDate,
  paymentTerms,
  items = [],
  taxCalculationResult,
  notes = "",
  poNumber = "",
  onProceedToIssue,
}) {
  if (!open) return null;

  const {
    subtotal = 0,
    taxRows = [],
    roundOff = 0,
    grandTotal = 0,
  } = taxCalculationResult || {};

  const customerName = customer?.billingName || customer?.name || "Customer";
  const customerAddress = [
    customer?.billingAddress || customer?.address,
    customer?.billingCity || customer?.city,
    customer?.billingState || customer?.state,
    customer?.billingPinCode || customer?.pinCode,
  ]
    .filter(Boolean)
    .join(", ");

  const gstin =
    customer?.gstin || customer?.gstNumber || "Unregistered / Consumer";
  const pan =
    customer?.pan || (gstin.length >= 12 ? gstin.substring(2, 12) : "—");
  const amountInWords = numberToWordsINR(grandTotal);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-3xl">
      <ModalHeader>
        <div>
          <ModalTitle className="flex items-center gap-2">
            <span>Invoice Preview</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
              {invoiceNumber || "DRAFT"}
            </span>
          </ModalTitle>
          <ModalDescription>
            Review official layout and taxes before document finalization.
          </ModalDescription>
        </div>
        <ModalClose onClose={onClose} />
      </ModalHeader>

      <ModalContent className="space-y-6 text-xs max-h-[75vh] overflow-y-auto pr-1">
        {/* Invoice Printable Document Box */}
        <div className="rounded-lg border border-border bg-surface/30 p-6 space-y-6 text-foreground">
          {/* Header Banner */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">FleetCore</h2>
              <p className="text-[11px] text-muted">
                Enterprise Logistics & Fleet Services
              </p>
              <p className="text-[11px] text-muted mt-1">
                HQ: Fleet Tower, Kurla Complex, Mumbai,{" "}
                {DEFAULT_COMPANY_STATE_NAME} - 400051
              </p>
              <p className="text-[11px] text-muted">
                GSTIN:{" "}
                <span className="font-mono font-semibold">
                  {DEFAULT_COMPANY_GSTIN}
                </span>{" "}
                · PAN:{" "}
                <span className="font-mono font-semibold">AABCF1234F</span>
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-primary text-primary-foreground font-mono text-xs font-bold uppercase tracking-wider">
                TAX INVOICE
              </span>
              <div className="mt-2 font-mono font-bold text-sm text-foreground">
                {invoiceNumber || "DRAFT-PREVIEW"}
              </div>
              <div className="text-[11px] text-muted mt-0.5">
                Date: {formatInvoiceDate(issueDate)}
              </div>
              <div className="text-[11px] text-muted">
                Due Date:{" "}
                <span className="font-semibold">
                  {formatInvoiceDate(dueDate)}
                </span>{" "}
                ({paymentTerms || "Net 30"})
              </div>
            </div>
          </div>

          {/* Customer & Trip Meta Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-border pb-5">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                BILLED TO / CUSTOMER
              </span>
              <div className="mt-1 font-bold text-sm text-foreground">
                {customerName}
              </div>
              <div className="text-muted mt-0.5 whitespace-pre-line leading-relaxed">
                {customerAddress || "No billing address provided"}
              </div>
              <div className="mt-2 font-mono text-[11px] text-muted">
                <span>
                  GSTIN:{" "}
                  <span className="font-semibold text-foreground">{gstin}</span>
                </span>
                <span className="mx-2">·</span>
                <span>
                  PAN:{" "}
                  <span className="font-semibold text-foreground">{pan}</span>
                </span>
              </div>
            </div>

            <div className="md:text-right">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                TRIP & DISPATCH REFERENCE
              </span>
              {trip ? (
                <div className="mt-1 space-y-1">
                  <div className="font-mono font-bold text-foreground">
                    Trip Code: {trip.tripCode}
                  </div>
                  <div className="text-muted">
                    {trip.pickupLocation} → {trip.dropLocation}
                  </div>
                  {vehicle && (
                    <div className="text-muted">
                      Vehicle: {vehicle.vehicleNumber} (
                      {vehicle.make || "Fleet"})
                    </div>
                  )}
                  {driver && (
                    <div className="text-muted">Driver: {driver.name}</div>
                  )}
                  {poNumber && (
                    <div className="font-mono text-muted">
                      PO / Cust Ref: {poNumber}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-1 text-muted">Direct Billing Document</div>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-surface text-[11px] font-semibold text-muted">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right">Tax (%)</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-mono text-muted">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-foreground">
                        {item.description}
                      </div>
                      {item.subtitle && (
                        <div className="text-[10px] text-muted">
                          {item.subtitle}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {Number(Math.abs(item.rate || 0)).toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-muted">
                      {item.taxRate !== undefined ? `${item.taxRate}%` : "0%"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {Number(item.amount || 0) < 0 ? "-" : ""}₹
                      {Number(Math.abs(item.amount || 0)).toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Financial Summary Grid */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-6 border-t border-border pt-4">
            <div className="space-y-2 max-w-sm">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
                BANK REMITTANCE DETAILS
              </span>
              <div className="rounded border border-border p-2.5 text-[11px] space-y-0.5 bg-card">
                <div>
                  Bank: <span className="font-semibold">HDFC Bank Ltd</span>
                </div>
                <div>
                  A/C Name:{" "}
                  <span className="font-semibold">
                    FleetCore Logistics Pvt Ltd
                  </span>
                </div>
                <div>
                  A/C No:{" "}
                  <span className="font-mono font-semibold">
                    50200088912344
                  </span>
                </div>
                <div>
                  IFSC:{" "}
                  <span className="font-mono font-semibold">HDFC0000240</span>
                </div>
                <div>
                  UPI ID:{" "}
                  <span className="font-mono font-semibold">
                    fleetcore@hdfcbank
                  </span>
                </div>
              </div>

              {notes && (
                <div className="text-[11px] text-muted mt-2">
                  <span className="font-semibold">Notes: </span>
                  {notes}
                </div>
              )}
            </div>

            <div className="w-full md:w-64 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal:</span>
                <span className="font-mono font-semibold">
                  ₹
                  {Number(subtotal).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {taxRows.map((t, idx) => (
                <div key={idx} className="flex justify-between text-muted">
                  <span>{t.name}:</span>
                  <span className="font-mono font-semibold text-foreground">
                    ₹
                    {Number(t.amount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}

              {roundOff !== 0 && (
                <div className="flex justify-between text-muted">
                  <span>Round Off:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {roundOff > 0 ? "+" : ""}₹
                    {Number(roundOff).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
                <span>Grand Total:</span>
                <span className="font-mono text-primary text-base">
                  ₹
                  {Number(grandTotal).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="text-[10px] text-muted text-right italic leading-tight pt-1">
                {amountInWords}
              </div>
            </div>
          </div>
        </div>
      </ModalContent>

      <ModalFooter className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="secondary" onClick={handlePrint}>
          <span className="material-symbols-outlined text-[16px] mr-1">
            print
          </span>
          Print Preview
        </Button>

        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Back to Review
          </Button>
          {onProceedToIssue && (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                onClose();
                onProceedToIssue();
              }}
            >
              Confirm & Issue Invoice
            </Button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}
