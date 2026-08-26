import { useState, useMemo, useEffect, useRef } from "react";
import { formatINR } from "../../utils/invoiceStatus";
import { isCustomerMatch } from "../../utils/ConsolidatedInvoice";

export default function CorporateCustomerDrawer({
  isOpen,
  onClose,
  customers = [],
  trips = [],
  invoices = [],
  selectedCustomerId = "",
  onSelectCustomer,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all"); // 'all' | 'with_trips' | 'with_outstanding' | 'corporate'
  const [sortBy, setSortBy] = useState("unbilled"); // 'unbilled' | 'name' | 'outstanding'
  const searchInputRef = useRef(null);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // Compute live unbilled trips and financials per customer
  const customerStats = useMemo(() => {
    // Map of billed trip IDs from existing non-cancelled invoices
    const billedTripIdSet = new Set();
    invoices.forEach((inv) => {
      if (inv.documentStatus === "cancelled" || inv.status === "cancelled")
        return;
      if (inv.tripId) billedTripIdSet.add(inv.tripId);
      if (Array.isArray(inv.tripIds)) {
        inv.tripIds.forEach((id) => billedTripIdSet.add(id));
      }
      if (Array.isArray(inv.trips)) {
        inv.trips.forEach((t) => {
          if (t.id) billedTripIdSet.add(t.id);
        });
      }
    });

    const statsMap = {};

    customers.forEach((cust) => {
      const cId = cust.id || cust.customerCode;

      // Find all completed trips for this customer that are not yet billed
      const customerTrips = trips.filter((t) => {
        const isMatch = isCustomerMatch(t.customerId, cId);
        const status = (t.tripStatus || t.status || "").toLowerCase();
        const isCompleted = status === "completed";
        const isNotBilled = !billedTripIdSet.has(t.id) && !t.invoiceId;
        return isMatch && isCompleted && isNotBilled;
      });

      const unbilledAmount = customerTrips.reduce((acc, t) => {
        return acc + (Number(t.totalAmount) || Number(t.baseRate) || 0);
      }, 0);

      statsMap[cId] = {
        unbilledCount: customerTrips.length,
        unbilledAmount,
        customerTrips,
      };
    });

    return statsMap;
  }, [customers, trips, invoices]);

  // Filtered and sorted customers list
  const filteredCustomers = useMemo(() => {
    let list = customers.map((c) => {
      const cId = c.id || c.customerCode;
      const stats = customerStats[cId] || {
        unbilledCount: 0,
        unbilledAmount: 0,
      };
      return {
        ...c,
        unbilledCount: stats.unbilledCount,
        unbilledAmount: stats.unbilledAmount,
      };
    });

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => {
        const name = (c.name || "").toLowerCase();
        const code = (c.customerCode || "").toLowerCase();
        const gstin = (c.gstin || c.gstNumber || "").toLowerCase();
        const contact = (c.contactPerson || "").toLowerCase();
        const city = (c.city || c.billingCity || "").toLowerCase();
        const email = (c.email || "").toLowerCase();
        const phone = (c.mobile1 || c.phone || "").toLowerCase();

        return (
          name.includes(q) ||
          code.includes(q) ||
          gstin.includes(q) ||
          contact.includes(q) ||
          city.includes(q) ||
          email.includes(q) ||
          phone.includes(q)
        );
      });
    }

    // Category Filter
    if (categoryFilter === "with_trips") {
      list = list.filter((c) => c.unbilledCount > 0);
    } else if (categoryFilter === "with_outstanding") {
      list = list.filter((c) => Number(c.outstandingAmount || 0) > 0);
    } else if (categoryFilter === "corporate") {
      list = list.filter(
        (c) =>
          c.customerType === "company" ||
          c.customerType === "corporate" ||
          c.customerType === "enterprise",
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "unbilled") {
        if (b.unbilledCount !== a.unbilledCount) {
          return b.unbilledCount - a.unbilledCount;
        }
        return b.unbilledAmount - a.unbilledAmount;
      }
      if (sortBy === "outstanding") {
        return (
          Number(b.outstandingAmount || 0) - Number(a.outstandingAmount || 0)
        );
      }
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }
      return 0;
    });

    return list;
  }, [customers, customerStats, searchQuery, categoryFilter, sortBy]);

  // Helper for company initial avatar
  const getAvatarInitials = (name) => {
    if (!name) return "CO";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Color generator for avatar based on name
  const getAvatarColor = (name = "") => {
    const colors = [
      "from-indigo-600 to-blue-600 text-white",
      "from-violet-600 to-purple-600 text-white",
      "from-sky-600 to-cyan-600 text-white",
      "from-emerald-600 to-teal-600 text-white",
      "from-amber-600 to-orange-600 text-white",
      "from-rose-600 to-pink-600 text-white",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex justify-end transition-opacity duration-300 animate-in fade-in"
      onClick={onClose}
    >
      {/* Drawer Container */}
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#111214] h-full shadow-2xl border-l border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. DRAWER HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#151718] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <span className="material-symbols-outlined text-2xl">domain</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Select Corporate Customer
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {customers.length} Accounts
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Choose a corporate client to aggregate trips and generate batch
                invoices.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
            aria-label="Close drawer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* 2. SEARCH & FILTER CONTROLS */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-[#151719] space-y-3">
          {/* Search Input Bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company name, code (CUST-8902A), GSTIN, city, or contact..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#1c1e20] text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-xs"
              >
                <span className="material-symbols-outlined text-base">
                  clear
                </span>
              </button>
            )}
          </div>

          {/* Filter Pills & Sort Dropdown */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  categoryFilter === "all"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
                }`}
              >
                All ({customers.length})
              </button>

              <button
                type="button"
                onClick={() => setCategoryFilter("with_trips")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  categoryFilter === "with_trips"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>With Unbilled Trips</span>
              </button>

              <button
                type="button"
                onClick={() => setCategoryFilter("with_outstanding")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  categoryFilter === "with_outstanding"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
                }`}
              >
                With Outstanding
              </button>

              <button
                type="button"
                onClick={() => setCategoryFilter("corporate")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  categoryFilter === "corporate"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100"
                }`}
              >
                Corporate / Enterprise
              </button>
            </div>

            {/* Sort selector */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1 rounded border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-[11px] focus:outline-none cursor-pointer"
              >
                <option value="unbilled">Unbilled Trips (High to Low)</option>
                <option value="name">Company Name (A-Z)</option>
                <option value="outstanding">Outstanding Balance</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. SCROLLABLE CUSTOMER DIRECTORY LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/40 dark:bg-[#0d0e0f]">
          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-zinc-500 space-y-2">
              <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-zinc-600">
                domain_disabled
              </span>
              <p className="font-semibold text-xs text-slate-700 dark:text-zinc-300">
                No matching corporate customers found
              </p>
              <p className="text-[11px]">
                Try clearing search query or selecting another filter category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                }}
                className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const cId = cust.id || cust.customerCode;
              const isSelected =
                cId === selectedCustomerId ||
                isCustomerMatch(cId, selectedCustomerId);
              const gstin = cust.gstin || cust.gstNumber;
              const hasGstin = Boolean(gstin && gstin.trim());
              const creditLimit = Number(cust.creditLimit || 500000);
              const outstanding = Number(cust.outstandingAmount || 0);
              const creditUsedPercent =
                creditLimit > 0
                  ? Math.min(Math.round((outstanding / creditLimit) * 100), 100)
                  : 0;

              return (
                <div
                  key={cId}
                  onClick={() => {
                    onSelectCustomer(cId);
                    onClose();
                  }}
                  className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                      : "bg-white dark:bg-[#17181a] border-slate-200/90 dark:border-zinc-800/90 hover:border-indigo-300 dark:hover:border-indigo-700/60 hover:shadow-sm"
                  }`}
                >
                  {/* Top Row: Avatar, Name, Code, and Select Indicator */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Company Avatar with Initials */}
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getAvatarColor(
                          cust.name,
                        )} flex items-center justify-center font-bold text-sm shadow-xs shrink-0`}
                      >
                        {getAvatarInitials(cust.name)}
                      </div>

                      {/* Customer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {cust.name}
                          </h3>
                          <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                            {cust.customerCode}
                          </span>
                          {cust.customerType && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                              {cust.customerType}
                            </span>
                          )}
                        </div>

                        {/* Location & Contact */}
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400 flex-wrap">
                          {cust.city && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-slate-400">
                                location_on
                              </span>
                              <span>
                                {cust.city}
                                {cust.state ? `, ${cust.state}` : ""}
                              </span>
                            </span>
                          )}

                          {cust.contactPerson && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-slate-400">
                                person
                              </span>
                              <span>{cust.contactPerson}</span>
                            </span>
                          )}

                          {cust.mobile1 && (
                            <span className="flex items-center gap-1 font-mono">
                              <span className="material-symbols-outlined text-[13px] text-slate-400">
                                call
                              </span>
                              <span>{cust.mobile1}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Radio / Selection Indicator */}
                    <div className="shrink-0 pt-0.5">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <span className="material-symbols-outlined text-sm font-bold">
                            check
                          </span>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-zinc-700 group-hover:border-indigo-400 transition-colors flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-indigo-400/40"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Row: GSTIN & Billing Status */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* GSTIN Details */}
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="text-slate-400 uppercase text-[10px]">
                        GSTIN:
                      </span>
                      {hasGstin ? (
                        <span className="font-semibold text-slate-800 dark:text-zinc-200">
                          {gstin}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 text-[10px] font-sans font-medium px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                          B2C / Unregistered
                        </span>
                      )}
                    </div>

                    {/* Payment Terms & Credit */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px]">
                      <span className="text-slate-400">Terms:</span>
                      <span className="font-medium text-slate-700 dark:text-zinc-300">
                        {cust.paymentStatus ||
                          (cust.creditDays
                            ? `Net ${cust.creditDays}`
                            : "Net 30")}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Unbilled Trips Callout & Outstanding Credit Bar */}
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    {/* Unbilled trips badge */}
                    <div>
                      {cust.unbilledCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          <span className="material-symbols-outlined text-[14px]">
                            local_shipping
                          </span>
                          <span>
                            {cust.unbilledCount} Unbilled Trip
                            {cust.unbilledCount > 1 ? "s" : ""} (₹
                            {cust.unbilledAmount.toLocaleString("en-IN")})
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800/50">
                          <span className="material-symbols-outlined text-xs">
                            done_all
                          </span>
                          <span>All trips currently invoiced</span>
                        </span>
                      )}
                    </div>

                    {/* Outstanding vs Credit Limit */}
                    <div className="w-full sm:w-auto flex items-center gap-3 font-mono text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase mr-1">
                          Outstanding:
                        </span>
                        <span
                          className={`font-semibold ${
                            outstanding > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-700 dark:text-zinc-300"
                          }`}
                        >
                          {formatINR(outstanding)}
                        </span>
                      </div>

                      {/* Mini visual credit usage bar */}
                      <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            creditUsedPercent > 80
                              ? "bg-rose-500"
                              : creditUsedPercent > 40
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${creditUsedPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. DRAWER FOOTER */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#151718] flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Showing {filteredCustomers.length} of {customers.length} corporate
            accounts
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
