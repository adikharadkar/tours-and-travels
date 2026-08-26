import {
  formatINR,
  formatInvoiceDate,
  getOverdueInfo,
  getDocumentStatusStyles,
  getPaymentStatusStyles,
  getDocumentTypeStyles,
} from "../../utils/invoiceStatus";
import InvoiceExportMenu from "./InvoiceExportMenu";

export default function InvoiceTable({
  invoices = [],
  sortField,
  sortDirection,
  onSort,
  onViewInvoice,
  onRecordPayment,
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#121314]">
      <table className="w-full text-left text-xs border-collapse">
        {/* Table Header */}
        <thead>
          <tr className="border-b border-slate-200 dark:border-[#27272a] bg-slate-50/70 dark:bg-[#161719] text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-500">
            <th
              scope="col"
              className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-slate-900 dark:hover:text-zinc-200"
              onClick={() => onSort("invoiceNumber")}
            >
              <div className="flex items-center gap-1">
                <span>Invoice</span>
                {sortField === "invoiceNumber" && (
                  <span className="material-symbols-outlined text-[14px]">
                    {sortDirection === "asc"
                      ? "arrow_upward"
                      : "arrow_downward"}
                  </span>
                )}
              </div>
            </th>

            <th
              scope="col"
              className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-slate-900 dark:hover:text-zinc-200"
              onClick={() => onSort("customerName")}
            >
              <div className="flex items-center gap-1">
                <span>Customer</span>
                {sortField === "customerName" && (
                  <span className="material-symbols-outlined text-[14px]">
                    {sortDirection === "asc"
                      ? "arrow_upward"
                      : "arrow_downward"}
                  </span>
                )}
              </div>
            </th>

            <th scope="col" className="py-3 px-4 font-semibold">
              Trip Reference
            </th>

            <th
              scope="col"
              className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-slate-900 dark:hover:text-zinc-200"
              onClick={() => onSort("issueDate")}
            >
              <div className="flex items-center gap-1">
                <span>Dates</span>
                {sortField === "issueDate" && (
                  <span className="material-symbols-outlined text-[14px]">
                    {sortDirection === "asc"
                      ? "arrow_upward"
                      : "arrow_downward"}
                  </span>
                )}
              </div>
            </th>

            <th
              scope="col"
              className="py-3 px-4 font-semibold text-right cursor-pointer select-none hover:text-slate-900 dark:hover:text-zinc-200"
              onClick={() => onSort("totalAmount")}
            >
              <div className="flex items-center justify-end gap-1">
                <span>Amount & Progress</span>
                {sortField === "totalAmount" && (
                  <span className="material-symbols-outlined text-[14px]">
                    {sortDirection === "asc"
                      ? "arrow_upward"
                      : "arrow_downward"}
                  </span>
                )}
              </div>
            </th>

            <th scope="col" className="py-3 px-4 font-semibold text-center">
              Status
            </th>

            <th scope="col" className="py-3 px-4 font-semibold text-right w-12">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-slate-100 dark:divide-[#1f2022]">
          {invoices.map((invoice) => {
            const docStatus = getDocumentStatusStyles(invoice.documentStatus);
            const overdueInfo = getOverdueInfo(
              invoice.dueDate,
              invoice.paymentStatus,
              invoice.documentStatus,
            );
            const isOverdue = overdueInfo.isOverdue;
            const pmtStatus = getPaymentStatusStyles(
              invoice.paymentStatus,
              isOverdue,
            );
            const docTypeStyles = getDocumentTypeStyles(invoice.documentType);

            const total = Number(invoice.totalAmount || 0);
            const paid = Number(invoice.paidAmount || 0);
            const due = Math.max(0, total - paid);
            const paidPercent =
              total > 0 ? Math.min(100, Math.max(0, (paid / total) * 100)) : 0;

            const isDraft = invoice.documentStatus === "draft";
            const isCancelled = invoice.documentStatus === "cancelled";
            const isFullyPaid =
              invoice.paymentStatus === "paid" || (total > 0 && due === 0);

            return (
              <tr
                key={invoice.id}
                onClick={() => onViewInvoice(invoice)}
                className="group hover:bg-slate-50/80 dark:hover:bg-[#18191b] transition-colors cursor-pointer"
              >
                {/* 1. INVOICE COLUMN */}
                <td className="py-3.5 px-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100 text-xs tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {invoice.invoiceNumber}
                    </span>
                    <span
                      className={["text-[11px]", docTypeStyles.badge].join(" ")}
                    >
                      {docTypeStyles.label}
                    </span>
                  </div>
                </td>

                {/* 2. CUSTOMER COLUMN */}
                <td className="py-3.5 px-4">
                  <div className="flex flex-col gap-0.5 max-w-[200px]">
                    <span className="font-medium text-slate-900 dark:text-zinc-200 truncate">
                      {invoice.customerName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                      {invoice.customerCode || invoice.customerGstin || "—"}
                    </span>
                  </div>
                </td>

                {/* 3. TRIP REFERENCE COLUMN */}
                <td className="py-3.5 px-4">
                  <div className="flex flex-col gap-0.5 max-w-[220px]">
                    {invoice.isConsolidated ? (
                      <>
                        <span className="font-medium text-slate-900 dark:text-zinc-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-indigo-500">
                            inventory_2
                          </span>
                          <span>
                            Multi ({invoice.consolidatedTripsCount || 1})
                          </span>
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                          {invoice.route ||
                            invoice.consolidatedPeriod ||
                            "Consolidated Trips"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-mono font-medium text-slate-800 dark:text-zinc-300">
                          {invoice.tripCode || "DIRECT-BILL"}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                          {invoice.route || "Point to Point Transit"}
                        </span>
                      </>
                    )}
                  </div>
                </td>

                {/* 4. DATES COLUMN */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-slate-600 dark:text-zinc-400">
                      Iss: {formatInvoiceDate(invoice.issueDate)}
                    </span>
                    {isDraft ? (
                      <span className="text-[11px] text-slate-400 dark:text-zinc-600">
                        —
                      </span>
                    ) : isOverdue ? (
                      <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">
                          error
                        </span>
                        <span>Due: {formatInvoiceDate(invoice.dueDate)}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                        Due: {formatInvoiceDate(invoice.dueDate)}
                      </span>
                    )}
                  </div>
                </td>

                {/* 5. AMOUNT & PROGRESS COLUMN */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 text-xs">
                      {formatINR(total)}
                    </span>

                    {!isDraft && !isCancelled && total > 0 ? (
                      <div className="w-24 flex flex-col items-end gap-0.5">
                        {/* Progress track */}
                        <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className={[
                              "h-full rounded-full transition-all duration-300",
                              isFullyPaid
                                ? "bg-emerald-500"
                                : isOverdue
                                  ? "bg-rose-500"
                                  : "bg-indigo-500",
                            ].join(" ")}
                            style={{ width: `${paidPercent}%` }}
                          />
                        </div>

                        {/* Progress label */}
                        <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                          {isFullyPaid
                            ? "Fully Paid"
                            : paid > 0
                              ? `${formatINR(paid, { compact: true })} paid`
                              : "Unpaid"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-zinc-600">
                        —
                      </span>
                    )}
                  </div>
                </td>

                {/* 6. STATUS COLUMN (Dual Badge: Document Status + Payment Status) */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {/* Document Status Pill */}
                    <span
                      className={[
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono whitespace-nowrap",
                        docStatus.pill,
                      ].join(" ")}
                    >
                      {docStatus.dot && (
                        <span
                          className={[
                            "w-1.5 h-1.5 rounded-full",
                            docStatus.dot,
                          ].join(" ")}
                        />
                      )}
                      <span>{docStatus.label}</span>
                    </span>

                    {/* Payment Status Pill (only show for issued/active non-draft items) */}
                    {!isDraft && (
                      <span
                        className={[
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono whitespace-nowrap",
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
                </td>

                {/* 7. ACTIONS COLUMN */}
                <td className="py-3.5 px-3 text-right relative">
                  <div className="flex items-center justify-end gap-1">
                    {!isDraft && !isCancelled && !isFullyPaid && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRecordPayment(invoice);
                        }}
                        title="Record Payment"
                        className="hidden sm:inline-flex items-center justify-center p-1.5 rounded text-slate-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[17px]">
                          payments
                        </span>
                      </button>
                    )}

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center"
                    >
                      <InvoiceExportMenu
                        invoice={invoice}
                        buttonVariant="ghost"
                        buttonSize="sm"
                        align="right"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewInvoice(invoice);
                      }}
                      title="View Details"
                      className="inline-flex items-center justify-center p-1.5 rounded text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[17px]">
                        visibility
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
