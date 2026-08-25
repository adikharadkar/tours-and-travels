const PREFIX_MAP = {
  tax_invoice: "INV",
  consolidated: "INV",
  proforma: "PRO",
  credit_note: "CRN",
  debit_note: "DBN",
  draft: "DRAFT",
};

export function generateInvoiceCode(
  documentType = "tax_invoice",
  sequenceNumber,
  isDraft = false,
  year = 2026,
) {
  if (isDraft) {
    const padded = String(sequenceNumber).padStart(3, "0");
    return `DRAFT-${padded}`;
  }

  const prefix = PREFIX_MAP[documentType] || "INV";
  const padded = String(sequenceNumber).padStart(4, "0");
  return `${prefix}-${year}-${padded}`;
}

export function formatInvoiceNumber(number) {
  return String(number || "").trim();
}
