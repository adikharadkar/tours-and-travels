import Modal, {
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  ModalClose,
} from "../ui/Modal";
import Button from "../ui/Button";

export default function IssueSuccessModal({
  open,
  onClose,
  invoice,
  onViewInvoice,
  onRecordPayment,
  onNavigateTrips,
  onNavigateInvoices,
}) {
  if (!invoice || !open) return null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <span className="material-symbols-outlined text-[24px]">
              check_circle
            </span>
          </div>
          <div>
            <ModalTitle>Invoice Issued Successfully</ModalTitle>
            <ModalDescription>
              Tax invoice{" "}
              <span className="font-mono font-bold text-foreground">
                {invoice.invoiceNumber}
              </span>{" "}
              is now active.
            </ModalDescription>
          </div>
        </div>
        <ModalClose onClose={onClose} />
      </ModalHeader>

      <ModalContent className="space-y-4 text-xs">
        <div className="rounded-lg border border-border bg-surface/40 p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted">Customer:</span>
            <span className="font-semibold text-foreground">
              {invoice.customerName}
            </span>
          </div>
          {invoice.tripCode && (
            <div className="flex justify-between items-center">
              <span className="text-muted">Trip Source:</span>
              <span className="font-mono font-semibold text-foreground">
                {invoice.tripCode}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-muted">Total Amount:</span>
            <span className="font-mono font-bold text-foreground">
              ₹
              {Number(invoice.totalAmount || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted">Payment Status:</span>
            <span className="capitalize font-medium text-amber-600 dark:text-amber-400">
              {invoice.paymentStatus || "Unpaid"}
            </span>
          </div>
        </div>

        {/* Quick Actions List */}
        <div className="space-y-2 pt-2">
          <Button
            type="button"
            variant="primary"
            className="w-full justify-center"
            onClick={onViewInvoice}
          >
            <span className="material-symbols-outlined text-[16px] mr-1.5">
              visibility
            </span>
            View Invoice Details
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-center"
              onClick={() => window.print()}
            >
              <span className="material-symbols-outlined text-[16px] mr-1">
                print
              </span>
              Print Invoice
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full justify-center"
              onClick={onRecordPayment}
            >
              <span className="material-symbols-outlined text-[16px] mr-1">
                payments
              </span>
              Record Payment
            </Button>
          </div>
        </div>
      </ModalContent>

      <ModalFooter className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onNavigateTrips}
          className="text-xs"
        >
          ← Back to Trips
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onNavigateInvoices}
          className="text-xs text-primary"
        >
          View Invoices List →
        </Button>
      </ModalFooter>
    </Modal>
  );
}
