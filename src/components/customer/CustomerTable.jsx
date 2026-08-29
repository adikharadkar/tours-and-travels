function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function getFinancialStatusBadge(status, paymentStatus) {
  if (status === "critical" || paymentStatus === "Collections - Hold") {
    return {
      label: paymentStatus || "Critical",
      pill: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20",
      dot: "bg-rose-500",
    };
  }
  if (status === "warning" || paymentStatus === "14 Days Overdue") {
    return {
      label: paymentStatus || "Overdue",
      pill: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
      dot: "bg-amber-500",
    };
  }
  return {
    label: paymentStatus || "Current",
    pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
    dot: "bg-emerald-500",
  };
}

export default function CustomerTable({
  customers = [],
  selectedCustomerIds = [],
  onToggleSelectCustomer,
  onToggleSelectAll,
  isAllSelected = false,
  sortField,
  sortDirection,
  onSort,
  onViewCustomer,
  onEditCustomer,
  onDeleteCustomer,
  highlightedCustomerId,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] shadow-xs">
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#13151f]">
              {onToggleSelectAll && (
                <th scope="col" className="w-10 px-4 py-3 align-middle">
                  <input
                    type="checkbox"
                    aria-label="Select all customers on this page"
                    checked={isAllSelected}
                    onChange={onToggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500/30 cursor-pointer"
                  />
                </th>
              )}

              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                onClick={() => onSort && onSort("name")}
              >
                <div className="flex items-center gap-1">
                  <span>Customer Name</span>
                  {sortField === "name" && (
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
                Type
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono"
              >
                Contact Info
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono"
              >
                Location
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                onClick={() => onSort && onSort("outstandingAmount")}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Outstanding & Status</span>
                  {sortField === "outstandingAmount" && (
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
                className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono"
              >
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-[#202330]">
            {customers.map((customer) => {
              const isSelected = selectedCustomerIds.includes(customer.id);
              const isHighlighted = customer.id === highlightedCustomerId;

              const finBadge = getFinancialStatusBadge(
                customer.financialStatus,
                customer.paymentStatus,
              );

              const initials = (customer.name || "C")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

              // Left indicator bar
              const leftBarColor =
                customer.isActive === false
                  ? "border-l-4 border-l-slate-400 dark:border-l-slate-600"
                  : customer.financialStatus === "critical" ||
                      customer.paymentStatus === "Collections - Hold"
                    ? "border-l-4 border-l-rose-500"
                    : customer.financialStatus === "warning" ||
                        customer.paymentStatus === "14 Days Overdue"
                      ? "border-l-4 border-l-amber-500"
                      : "border-l-4 border-l-emerald-500";

              return (
                <tr
                  key={customer.id}
                  onClick={() => onViewCustomer && onViewCustomer(customer)}
                  className={[
                    "group transition-colors duration-150 relative cursor-pointer",
                    leftBarColor,
                    isHighlighted
                      ? "bg-cyan-500/10 dark:bg-cyan-950/40 ring-1 ring-inset ring-cyan-400/40"
                      : isSelected
                        ? "bg-cyan-50/50 dark:bg-cyan-950/20"
                        : "hover:bg-slate-50/80 dark:hover:bg-[#1a1c28]",
                  ].join(" ")}
                >
                  {/* Select Checkbox */}
                  {onToggleSelectCustomer && (
                    <td
                      className="w-10 px-4 py-3 align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select ${customer.name}`}
                        checked={isSelected}
                        onChange={() => onToggleSelectCustomer(customer.id)}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500/30 cursor-pointer"
                      />
                    </td>
                  )}

                  {/* 1. CUSTOMER NAME & CODE */}
                  <td className="px-4 py-3 align-middle max-w-[220px]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#1f2230] border border-slate-200 dark:border-[#262837] flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs shrink-0 select-none">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          {customer.name}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 dark:text-slate-400 truncate mt-0.5">
                          <span>{customer.customerCode || "—"}</span>

                          {customer.gstin && (
                            <>
                              <span>·</span>
                              <span className="truncate">
                                GST: {customer.gstin}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. CUSTOMER TYPE */}
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <span
                      className={[
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider",
                        customer.customerType === "company"
                          ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-[#d0bcff] border border-purple-200 dark:border-purple-800/40"
                          : "bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
                      ].join(" ")}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {customer.customerType === "company"
                          ? "corporate_fare"
                          : "person"}
                      </span>

                      <span>
                        {customer.customerType === "company"
                          ? "Corporate"
                          : "Individual"}
                      </span>
                    </span>
                  </td>

                  {/* 3. CONTACT INFO */}
                  <td className="px-4 py-3 align-middle max-w-[200px]">
                    <div className="min-w-0 text-xs">
                      {customer.email ? (
                        <div className="text-slate-800 dark:text-slate-200 truncate font-medium">
                          {customer.email}
                        </div>
                      ) : (
                        <div className="text-slate-400 dark:text-slate-500">
                          —
                        </div>
                      )}

                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {customer.mobile1 || customer.phone || "—"}

                        {customer.contactPerson && (
                          <span className="ml-1 text-slate-400">
                            ({customer.contactPerson})
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 4. LOCATION */}
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {customer.city || "—"}
                    </div>

                    <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                      {customer.state || "—"}
                    </div>
                  </td>

                  {/* 5. OUTSTANDING AMOUNT & STATUS */}
                  <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                        {formatINR(customer.outstandingAmount || 0)}
                      </span>

                      <span
                        className={[
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold font-mono",
                          finBadge.pill,
                        ].join(" ")}
                      >
                        {finBadge.dot && (
                          <span
                            className={[
                              "w-1.5 h-1.5 rounded-full",
                              finBadge.dot,
                            ].join(" ")}
                          />
                        )}

                        <span>{finBadge.label}</span>
                      </span>
                    </div>
                  </td>

                  {/* 6. ACTIONS */}
                  <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {/* View Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewCustomer) {
                            onViewCustomer(customer);
                          }
                        }}
                        title="View Details"
                        aria-label={`View ${customer.name}`}
                        className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] hover:bg-slate-50 dark:hover:bg-[#1f2230] text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-500 dark:text-slate-400">
                          visibility
                        </span>

                        <span>View</span>
                      </button>

                      {/* Edit Button */}
                      {onEditCustomer && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditCustomer(customer);
                          }}
                          title="Edit Customer"
                          aria-label={`Edit ${customer.name}`}
                          className="h-8 w-8 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] hover:bg-slate-50 dark:hover:bg-[#1f2230] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            edit
                          </span>
                        </button>
                      )}

                      {/* Delete Button */}
                      {onDeleteCustomer && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCustomer(customer);
                          }}
                          title="Delete Customer"
                          aria-label={`Delete ${customer.name}`}
                          className="h-8 w-8 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 inline-flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            delete
                          </span>
                        </button>
                      )}
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
