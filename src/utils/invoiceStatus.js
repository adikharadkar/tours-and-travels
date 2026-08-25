/**
 * Format an amount into Indian Rupee format (e.g., ₹8,42,500)
 */
export function formatINR(amount, options = {}) {
  const num = Number(amount || 0);
  const { compact = false, showDecimals = false } = options;

  if (compact && Math.abs(num) >= 100000) {
    const lakhs = (num / 100000).toFixed(2).replace(/\.?0+$/, "");
    return `₹${lakhs}L`;
  }

  if (compact && Math.abs(num) >= 1000) {
    const k = (num / 1000).toFixed(0);
    return `₹${k}k`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);
}

/**
 * Format a date string into readable short date (e.g. "Oct 12, 2026" or "25 Aug 2026")
 */
export function formatInvoiceDate(dateString) {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Calculate overdue days or days remaining until due date
 */
export function getOverdueInfo(dueDateString, paymentStatus, documentStatus) {
  if (documentStatus === "draft" || documentStatus === "cancelled") {
    return { isOverdue: false, text: "", days: 0 };
  }
  if (paymentStatus === "paid" || paymentStatus === "credit") {
    return { isOverdue: false, text: "", days: 0 };
  }
  if (!dueDateString) {
    return { isOverdue: false, text: "", days: 0 };
  }

  try {
    const due = new Date(dueDateString);
    if (isNaN(due.getTime())) return { isOverdue: false, text: "", days: 0 };

    // Set time to end of day
    due.setHours(23, 59, 59, 999);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return {
        isOverdue: true,
        days: diffDays,
        text: `Overdue by ${diffDays} ${diffDays === 1 ? "day" : "days"}`,
      };
    } else {
      const remainingDays = Math.abs(diffDays);
      return {
        isOverdue: false,
        days: remainingDays,
        text:
          remainingDays === 0
            ? "Due today"
            : `Due in ${remainingDays} ${remainingDays === 1 ? "day" : "days"}`,
      };
    }
  } catch {
    return { isOverdue: false, text: "", days: 0 };
  }
}

/**
 * Visual styling classes for Document Status
 */
export function getDocumentStatusStyles(status) {
  switch (String(status || "").toLowerCase()) {
    case "issued":
      return {
        pill: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-500/40",
        dot: "bg-indigo-400",
        label: "Issued",
      };
    case "draft":
      return {
        pill: "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-400 dark:border-zinc-700/60",
        dot: null,
        label: "Draft",
      };
    case "revised":
      return {
        pill: "bg-purple-500/10 text-purple-400 border border-purple-500/30 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-500/40",
        dot: "bg-purple-400",
        label: "Revised",
      };
    case "cancelled":
      return {
        pill: "bg-rose-500/10 text-rose-400 border border-rose-500/30 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/50 line-through opacity-80",
        dot: null,
        label: "Cancelled",
      };
    default:
      return {
        pill: "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
        dot: null,
        label: status || "Draft",
      };
  }
}

/**
 * Visual styling classes for Payment Status
 */
export function getPaymentStatusStyles(status, isOverdue = false) {
  const normStatus =
    isOverdue && status !== "paid"
      ? "overdue"
      : String(status || "").toLowerCase();

  switch (normStatus) {
    case "paid":
      return {
        pill: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-500/30",
        dot: "bg-emerald-500 dark:bg-emerald-400",
        label: "Paid",
      };
    case "overdue":
      return {
        pill: "bg-rose-500/10 text-rose-600 border border-rose-500/30 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-500/40 font-medium",
        dot: "bg-rose-500 dark:bg-rose-400",
        label: "Overdue",
      };
    case "partially_paid":
      return {
        pill: "bg-amber-500/10 text-amber-600 border border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-500/40",
        dot: "bg-amber-500 dark:bg-amber-400",
        label: "Partially Paid",
      };
    case "unpaid":
      return {
        pill: "bg-zinc-100 text-zinc-700 border border-zinc-300 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700",
        dot: null,
        label: "Unpaid",
      };
    case "credit":
      return {
        pill: "bg-sky-500/10 text-sky-600 border border-sky-500/30 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-500/40",
        dot: "bg-sky-400",
        label: "Credit",
      };
    default:
      return {
        pill: "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
        dot: null,
        label: status || "Unpaid",
      };
  }
}

/**
 * Visual styling classes for Document Types
 */
export function getDocumentTypeStyles(docType) {
  switch (String(docType || "").toLowerCase()) {
    case "tax_invoice":
      return {
        label: "Tax Invoice",
        badge: "text-zinc-500 dark:text-zinc-400",
      };
    case "consolidated":
      return {
        label: "Consolidated",
        badge: "text-indigo-600 dark:text-indigo-400 font-medium",
      };
    case "proforma":
      return {
        label: "Proforma",
        badge: "text-amber-600 dark:text-amber-400 italic",
      };
    case "credit_note":
      return {
        label: "Credit Note",
        badge: "text-sky-600 dark:text-sky-400 font-medium",
      };
    case "debit_note":
      return {
        label: "Debit Note",
        badge: "text-purple-600 dark:text-purple-400 font-medium",
      };
    default:
      return {
        label: docType || "Invoice",
        badge: "text-zinc-500 dark:text-zinc-400",
      };
  }
}
