import { generateInvoiceCode } from "../utils/invoiceCode";

const INVOICE_SEQUENCE_KEY = "invoice_sequence";

export function getNextInvoiceCode(
  documentType = "tax_invoice",
  isDraft = false,
) {
  let currentSequence = Number(
    localStorage.getItem(INVOICE_SEQUENCE_KEY) ?? "0",
  );

  if (currentSequence === 0) {
    try {
      const stored = localStorage.getItem("invoices");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          currentSequence = parsed.length;
        }
      }
    } catch {
      currentSequence = 84;
    }
  }

  const nextSequence = currentSequence + 1;
  localStorage.setItem(INVOICE_SEQUENCE_KEY, String(nextSequence));

  return generateInvoiceCode(documentType, nextSequence, isDraft);
}
