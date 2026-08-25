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

export default function IssueConfirmModal({
  open,
  onClose,
  invoiceNumber,
  customerName,
  tripCode,
  grandTotal,
  dueDate,
  onConfirm,
  isIssuing = false,
}) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      <ModalHeader>
        <div>
          <ModalTitle>Confirm Invoice Issuance</ModalTitle>
          <ModalDescription>
            This action will finalize the invoice as an official tax document.
          </ModalDescription>
        </div>
        <ModalClose onClose={onClose} />
      </ModalHeader>

      <ModalContent className="space-y-4 text-xs">
        <div className="rounded-lg border border-border bg-surface/50 p-4 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-muted">Invoice Number:</span>
            <span className="font-mono font-bold text-foreground">
              {invoiceNumber}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted">Customer:</span>
            <span className="font-semibold text-foreground truncate max-w-[200px]">
              {customerName}
            </span>
          </div>

          {tripCode && (
            <div className="flex justify-between items-center">
              <span className="text-muted">Generated From:</span>
              <span className="font-mono font-medium text-foreground">
                {tripCode}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-muted">Due Date:</span>
            <span className="font-medium text-foreground">
              {formatInvoiceDate(dueDate)}
            </span>
          </div>

          <div className="flex justify-between items-center border-t border-border pt-2">
            <span className="text-sm font-bold text-foreground">
              Grand Total:
            </span>
            <span className="font-mono text-base font-bold text-primary">
              ₹
              {Number(grandTotal || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <p className="text-muted leading-relaxed">
          Once issued, the invoice will be marked active in receivables and
          linked directly to this completed trip.
        </p>
      </ModalContent>

      <ModalFooter className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isIssuing}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onConfirm}
          disabled={isIssuing}
        >
          {isIssuing ? "Issuing Invoice..." : "Confirm & Issue Invoice"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
