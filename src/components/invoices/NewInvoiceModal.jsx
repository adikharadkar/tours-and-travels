import { useState, useEffect } from "react";
import Modal, {
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
} from "../ui/Modal";
import Button from "../ui/Button";
import { formatINR } from "../../utils/invoiceStatus";

export default function NewInvoiceModal({
  isOpen,
  open,
  onClose,
  customers = [],
  trips = [],
  onSaveInvoice,
}) {
  const isModalOpen = open !== undefined ? open : isOpen;
  const [customerId, setCustomerId] = useState("");
  const [documentType, setDocumentType] = useState("tax_invoice");
  const [documentStatus, setDocumentStatus] = useState("issued");
  const [tripId, setTripId] = useState("");
  const [route, setRoute] = useState("");
  const [subtotal, setSubtotal] = useState("");
  const [taxRate, setTaxRate] = useState(12);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [issueDate, setIssueDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [paymentTerms, setPaymentTerms] = useState("Net 15");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // Populate first customer if empty
  useEffect(() => {
    if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id || customers[0].customerCode);
    }
  }, [customers, customerId]);

  // When a trip is selected, automatically fill route and amount
  const handleTripChange = (selectedTripId) => {
    setTripId(selectedTripId);
    if (!selectedTripId) return;

    const matchedTrip = trips.find((t) => t.id === selectedTripId);
    if (matchedTrip) {
      if (matchedTrip.customerId) {
        setCustomerId(matchedTrip.customerId);
      }
      setRoute(
        `${matchedTrip.pickupLocation || ""} → ${matchedTrip.dropLocation || ""}`,
      );
      setSubtotal(matchedTrip.baseRate || matchedTrip.totalAmount || "");
      if (matchedTrip.taxRate !== undefined) {
        setTaxRate(matchedTrip.taxRate);
      }
    }
  };

  const calculatedSubtotal = Number(subtotal || 0);
  const calculatedTax = (calculatedSubtotal * Number(taxRate || 0)) / 100;
  const calculatedTotal =
    calculatedSubtotal + calculatedTax - Number(discountAmount || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerId) {
      setError("Please select a customer.");
      return;
    }
    if (calculatedSubtotal <= 0 && documentType !== "credit_note") {
      setError("Please enter a valid invoice amount.");
      return;
    }

    const selectedCustomer = customers.find(
      (c) => c.id === customerId || c.customerCode === customerId,
    );

    const selectedTrip = trips.find((t) => t.id === tripId);

    const invoicePayload = {
      customerId,
      customerName: selectedCustomer ? selectedCustomer.name : "Customer",
      customerCode: selectedCustomer ? selectedCustomer.customerCode : "",
      customerGstin: selectedCustomer
        ? selectedCustomer.gstin || selectedCustomer.gstNumber || ""
        : "",
      documentType,
      documentStatus,
      tripId: tripId || null,
      tripCode: selectedTrip
        ? selectedTrip.tripCode
        : documentType === "consolidated"
          ? "CONSOLIDATED"
          : "",
      route:
        route ||
        (documentType === "consolidated"
          ? "Consolidated Route Movements"
          : "Point-to-point Transport"),
      isConsolidated: documentType === "consolidated",
      consolidatedTripsCount: documentType === "consolidated" ? 3 : 1,
      consolidatedPeriod:
        documentType === "consolidated" ? "Current Billing Cycle" : "",
      issueDate,
      dueDate,
      subtotal: calculatedSubtotal,
      taxRate: Number(taxRate || 0),
      taxAmount: calculatedTax,
      discountAmount: Number(discountAmount || 0),
      totalAmount: calculatedTotal,
      paidAmount: 0,
      outstandingAmount: calculatedTotal,
      paymentStatus: documentType === "credit_note" ? "credit" : "unpaid",
      paymentTerms,
      notes,
      items: [
        {
          description:
            route || "Fleet Passenger & Logistics Transportation Service",
          quantity: 1,
          unitRate: calculatedSubtotal,
          amount: calculatedSubtotal,
        },
      ],
    };

    onSaveInvoice(invoicePayload);
    onClose();
  };

  return (
    <Modal open={isModalOpen} onClose={onClose} className="max-w-xl">
      <ModalHeader>
        <ModalTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
          Create New Invoice
        </ModalTitle>
        <ModalDescription className="text-xs text-slate-500 dark:text-zinc-400">
          Generate an official tax invoice, proforma quotation, or credit note.
        </ModalDescription>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalContent className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Document Type & Initial Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Document Type *
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="tax_invoice">Tax Invoice (Standard GST)</option>
                <option value="consolidated">
                  Consolidated Invoice (Multi-Trip)
                </option>
                <option value="proforma">Proforma Invoice (Quotation)</option>
                <option value="credit_note">
                  Credit Note (Rebate / Adjustment)
                </option>
                <option value="debit_note">
                  Debit Note (Supplementary Fee)
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Initial Status *
              </label>
              <select
                value={documentStatus}
                onChange={(e) => setDocumentStatus(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="issued">Issued (Ready for payment)</option>
                <option value="draft">Draft (Save for review)</option>
              </select>
            </div>
          </div>

          {/* Customer selection */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Customer *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {customers.map((c) => (
                <option
                  key={c.id || c.customerCode}
                  value={c.id || c.customerCode}
                >
                  {c.name} ({c.customerCode})
                </option>
              ))}
            </select>
          </div>

          {/* Optional Trip Linking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Link to Completed Trip (Optional)
              </label>
              <select
                value={tripId}
                onChange={(e) => handleTripChange(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">-- No trip linked / Direct billing --</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tripCode} &bull; {t.pickupLocation} → {t.dropLocation} (
                    {formatINR(t.totalAmount || t.baseRate)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Route Summary / Reference *
              </label>
              <input
                type="text"
                placeholder="e.g. Mumbai → Pune Executive Coach"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Dates & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Issue Date *
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
              >
                <option value="Immediate">Immediate / Advance</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 45">Net 45 Days</option>
                <option value="Net 60">Net 60 Days</option>
              </select>
            </div>
          </div>

          {/* Amount and GST Calculation */}
          <div className="p-3 rounded-md bg-slate-50 dark:bg-[#161719] border border-slate-200 dark:border-[#27272a] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Subtotal (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={subtotal}
                  onChange={(e) => setSubtotal(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  GST Rate
                </label>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5% (Transport / RCM)</option>
                  <option value={12}>12% (Standard Passenger)</option>
                  <option value={18}>18% (Luxury / Tour Operator)</option>
                  <option value={28}>28%</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Total summary calculation */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-zinc-700 text-xs font-mono">
              <span className="text-slate-500 dark:text-zinc-400">
                GST: {formatINR(calculatedTax)} &bull; Discount:{" "}
                {formatINR(discountAmount || 0)}
              </span>
              <div className="text-right">
                <span className="text-slate-600 dark:text-zinc-400 mr-2">
                  Grand Total:
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  {formatINR(calculatedTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
              Remarks / Notes
            </label>
            <textarea
              rows="2"
              placeholder="Terms, bank account details, or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none placeholder-slate-400"
            />
          </div>
        </ModalContent>

        <ModalFooter className="border-t border-slate-200 dark:border-[#27272a] pt-3">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Create Invoice ({formatINR(calculatedTotal)})
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
