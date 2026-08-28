import {
  formatINR,
  formatInvoiceDate,
  getOverdueInfo,
  getDocumentStatusStyles,
  getPaymentStatusStyles,
  getDocumentTypeStyles,
} from "../../utils/invoiceStatus";

export default function InvoiceTable({
  invoices = [],
  sortField,
  sortDirection,
  onSort,
  onViewInvoice,
  onOpenActionsDrawer,
  onRecordPayment,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] shadow-xs">
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#13151f]">
              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
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
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
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

              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono"
              >
                Trip Reference
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
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
                className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
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

              <th
                scope="col"
                className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono"
              >
                Status
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono"
              >
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-[#202330]">
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
                total > 0
                  ? Math.min(100, Math.max(0, (paid / total) * 100))
                  : 0;

              const isDraft = invoice.documentStatus === "draft";
              const isCancelled = invoice.documentStatus === "cancelled";
              const isFullyPaid =
                invoice.paymentStatus === "paid" || (total > 0 && due === 0);

              // Left indicator bar matching FleetCore Trips / Vehicles tables
              let leftBarColor = "border-l-transparent";
              if (invoice.documentStatus === "cancelled") {
                leftBarColor =
                  "border-l-4 border-l-slate-400 dark:border-l-slate-600";
              } else if (isOverdue) {
                leftBarColor = "border-l-4 border-l-rose-500";
              } else if (isFullyPaid) {
                leftBarColor = "border-l-4 border-l-emerald-500";
              } else if (invoice.paymentStatus === "partially_paid") {
                leftBarColor = "border-l-4 border-l-amber-500";
              } else if (invoice.documentStatus === "issued") {
                leftBarColor = "border-l-4 border-l-purple-500";
              }

              return (
                <tr
                  key={invoice.id}
                  onClick={() => onViewInvoice(invoice)}
                  className={[
                    "group transition-colors duration-150 relative cursor-pointer",
                    leftBarColor,
                    "hover:bg-slate-50/80 dark:hover:bg-[#1a1c28]",
                  ].join(" ")}
                >
                  {/* 1. INVOICE COLUMN */}
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-[#d0bcff] transition-colors">
                        {invoice.invoiceNumber}
                      </span>
                      <span
                        className={[
                          "text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider w-fit inline-block mt-0.5",
                          docTypeStyles.badge,
                        ].join(" ")}
                      >
                        {docTypeStyles.label}
                      </span>
                    </div>
                  </td>

                  {/* 2. CUSTOMER COLUMN */}
                  <td className="px-4 py-3 align-middle max-w-[220px]">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {invoice.customerName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 dark:text-slate-400 truncate mt-0.5">
                        {invoice.customerCode || invoice.customerGstin || "—"}
                      </div>
                    </div>
                  </td>

                  {/* 3. TRIP REFERENCE COLUMN */}
                  <td className="px-4 py-3 align-middle max-w-[220px]">
                    <div className="min-w-0">
                      {invoice.isConsolidated ? (
                        <>
                          <div className="font-semibold text-xs text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px] text-purple-600 dark:text-purple-400 shrink-0">
                              inventory_2
                            </span>
                            <span>
                              Multi ({invoice.consolidatedTripsCount || 1})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {invoice.route ||
                              invoice.consolidatedPeriod ||
                              "Consolidated Trips"}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-mono font-semibold text-xs text-slate-900 dark:text-slate-200">
                            {invoice.tripCode || "DIRECT-BILL"}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {invoice.route || "Point to Point Transit"}
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* 4. DATES COLUMN */}
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <div className="min-w-0 text-xs">
                      <div className="font-semibold text-slate-900 dark:text-slate-200">
                        Iss: {formatInvoiceDate(invoice.issueDate)}
                      </div>
                      {isDraft ? (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          —
                        </div>
                      ) : isOverdue ? (
                        <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[13px] shrink-0">
                            error
                          </span>
                          <span>Due: {formatInvoiceDate(invoice.dueDate)}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Due: {formatInvoiceDate(invoice.dueDate)}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 5. AMOUNT & PROGRESS COLUMN */}
                  <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                        {formatINR(total)}
                      </span>

                      {!isDraft && !isCancelled && total > 0 ? (
                        <div className="w-24 flex flex-col items-end gap-0.5 mt-1">
                          {/* Progress track */}
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-[#1f2230] overflow-hidden">
                            <div
                              className={[
                                "h-full rounded-full transition-all duration-300",
                                isFullyPaid
                                  ? "bg-emerald-500"
                                  : isOverdue
                                    ? "bg-rose-500"
                                    : "bg-[#8b5cf6] dark:bg-[#d0bcff]",
                              ].join(" ")}
                              style={{ width: `${paidPercent}%` }}
                            />
                          </div>

                          {/* Progress label */}
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            {isFullyPaid
                              ? "Fully Paid"
                              : paid > 0
                                ? `${formatINR(paid, { compact: true })} paid`
                                : "Unpaid"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          —
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 6. STATUS COLUMN (Dual Badge: Document Status + Payment Status) */}
                  <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {/* Document Status Pill */}
                      <span
                        className={[
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono",
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
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono",
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

                  {/* 7. ACTIONS COLUMN (View button + 3-dots Actions Drawer trigger) */}
                  <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {/* View Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewInvoice(invoice);
                        }}
                        title="View Details"
                        aria-label="View Details"
                        className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] hover:bg-slate-50 dark:hover:bg-[#1f2230] text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-500 dark:text-slate-400">
                          visibility
                        </span>
                        <span>View</span>
                      </button>

                      {/* 3-Dots Action Drawer Trigger Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenActionsDrawer) {
                            onOpenActionsDrawer(invoice);
                          } else if (onRecordPayment) {
                            onRecordPayment(invoice);
                          }
                        }}
                        title="Invoice Actions"
                        aria-label={`Actions for ${invoice.invoiceNumber}`}
                        data-testid={`invoice-actions-btn-${invoice.id}`}
                        className="h-8 w-8 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] hover:bg-slate-50 dark:hover:bg-[#1f2230] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          more_vert
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
    </div>
  );
}
