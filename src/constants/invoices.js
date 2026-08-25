export const INVOICE_DOCUMENT_TYPES = [
  { value: "all", label: "All Invoices" },
  { value: "tax_invoice", label: "Tax Invoice" },
  { value: "consolidated", label: "Consolidated" },
  { value: "proforma", label: "Proforma" },
  { value: "credit_note", label: "Credit Note" },
  { value: "debit_note", label: "Debit Note" },
];

export const INVOICE_DOCUMENT_TYPE_LABELS = {
  tax_invoice: "Tax Invoice",
  consolidated: "Consolidated",
  proforma: "Proforma",
  credit_note: "Credit Note",
  debit_note: "Debit Note",
};

export const DOCUMENT_STATUSES = [
  { value: "all", label: "All Document Statuses" },
  { value: "draft", label: "Draft" },
  { value: "issued", label: "Issued" },
  { value: "revised", label: "Revised" },
  { value: "cancelled", label: "Cancelled" },
];

export const DOCUMENT_STATUS_LABELS = {
  draft: "Draft",
  issued: "Issued",
  revised: "Revised",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUSES = [
  { value: "all", label: "All Payment Statuses" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "credit", label: "Credit" },
];

export const PAYMENT_STATUS_LABELS = {
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
  credit: "Credit",
};

export const DATE_PRESET_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "last_month", label: "Last Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "custom", label: "Custom Range" },
];

export const SORT_OPTIONS = [
  { value: "date_desc", label: "Invoice Date (Newest first)" },
  { value: "date_asc", label: "Invoice Date (Oldest first)" },
  { value: "due_date_asc", label: "Due Date (Earliest first)" },
  { value: "amount_desc", label: "Amount (High to Low)" },
  { value: "amount_asc", label: "Amount (Low to High)" },
  { value: "outstanding_desc", label: "Outstanding (High to Low)" },
  { value: "customer_asc", label: "Customer (A-Z)" },
  { value: "invoice_number_desc", label: "Invoice # (Desc)" },
];
