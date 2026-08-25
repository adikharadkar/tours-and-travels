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

export default function RecordPaymentModal({
  isOpen,
  open,
  onClose,
  invoice,
  onSavePayment,
}) {
  const isModalOpen = open !== undefined ? open : isOpen;
  const total = Number(invoice?.totalAmount || 0);
  const paid = Number(invoice?.paidAmount || 0);
  const outstanding = Math.max(0, total - paid);

  const [amount, setAmount] = useState(outstanding);
  const [paymentDate, setPaymentDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [paymentMode, setPaymentMode] = useState("bank_transfer");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (invoice) {
      const remaining = Math.max(
        0,
        Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0),
      );
      setAmount(remaining);
      setError("");
    }
  }, [invoice]);

  if (!invoice || !isModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const pmtAmount = Number(amount);

    if (isNaN(pmtAmount) || pmtAmount <= 0) {
      setError("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (pmtAmount > outstanding) {
      setError(
        `Payment amount cannot exceed outstanding balance of ${formatINR(outstanding)}.`,
      );
      return;
    }

    setError("");
    onSavePayment(invoice.id, {
      amount: pmtAmount,
      paymentDate,
      paymentMode,
      referenceNumber,
      notes,
    });
    onClose();
  };

  return (
    <Modal open={isModalOpen} onClose={onClose} className="max-w-md">
      <ModalHeader>
        <ModalTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
          Record Payment — {invoice.invoiceNumber}
        </ModalTitle>
        <ModalDescription className="text-xs text-slate-500 dark:text-zinc-400">
          {invoice.customerName} &bull; Outstanding Balance:{" "}
          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
            {formatINR(outstanding)}
          </span>
        </ModalDescription>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalContent className="space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Amount field */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Payment Amount (₹) *
              </label>
              <button
                type="button"
                onClick={() => setAmount(outstanding)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Pay full ({formatINR(outstanding)})
              </button>
            </div>
            <input
              type="number"
              step="any"
              // min="1"
              // max={outstanding}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              // required
              className="w-full px-3 py-2 text-sm font-mono font-bold rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Date and Payment Mode grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Payment Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Payment Mode *
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="bank_transfer">
                  Bank Transfer (NEFT/RTGS/IMPS)
                </option>
                <option value="upi">UPI (GPay / PhonePe / QR)</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="card">Credit / Debit Card</option>
              </select>
            </div>
          </div>

          {/* Reference Number */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
              Transaction / Reference Number
            </label>
            <input
              type="text"
              placeholder="e.g. UTR / NEFT Ref / UPI-10829374"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
              Notes
            </label>
            <textarea
              rows="2"
              placeholder="Optional notes or remarks"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#121314] text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
            />
          </div>
        </ModalContent>

        <ModalFooter className="border-t border-slate-200 dark:border-[#27272a] pt-3">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Confirm Payment ({formatINR(amount || 0)})
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
