import { useState, useRef, useEffect, useMemo } from "react";
import { formatINR } from "../../utils/invoiceStatus";
import { isCustomerMatch } from "../../utils/ConsolidatedInvoice";
import CorporateCustomerDrawer from "./CorporateCustomerDrawer";

export default function CorporateCustomerSelector({
  customers = [],
  trips = [],
  invoices = [],
  selectedCustomerId = "",
  onSelectCustomer,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Current active customer
  const currentCustomer = useMemo(() => {
    return (
      customers.find(
        (c) =>
          c.id === selectedCustomerId ||
          c.customerCode === selectedCustomerId ||
          isCustomerMatch(c.id, selectedCustomerId),
      ) || null
    );
  }, [customers, selectedCustomerId]);

  // Compute live unbilled trips count for each customer
  const unbilledStats = useMemo(() => {
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

    const stats = {};
    customers.forEach((c) => {
      const cId = c.id || c.customerCode;
      const count = trips.filter((t) => {
        const isMatch = isCustomerMatch(t.customerId, cId);
        const status = (t.tripStatus || t.status || "").toLowerCase();
        return (
          isMatch &&
          status === "completed" &&
          !billedTripIdSet.has(t.id) &&
          !t.invoiceId
        );
      }).length;
      stats[cId] = count;
    });
    return stats;
  }, [customers, trips, invoices]);

  // Filtered customers for the quick dropdown
  const quickList = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const code = (c.customerCode || "").toLowerCase();
      const gstin = (c.gstin || c.gstNumber || "").toLowerCase();
      const city = (c.city || c.billingCity || "").toLowerCase();
      return (
        name.includes(q) ||
        code.includes(q) ||
        gstin.includes(q) ||
        city.includes(q)
      );
    });
  }, [customers, searchQuery]);

  // Company avatar initials
  const getInitials = (name) => {
    if (!name) return "CO";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

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

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Label and Drawer Trigger Button */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-indigo-600 dark:text-indigo-400">
            domain
          </span>
          <span>Target Corporate Customer *</span>
        </label>

        <button
          type="button"
          onClick={() => {
            setIsDropdownOpen(false);
            setIsDrawerOpen(true);
          }}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">
            view_sidebar
          </span>
          <span>Browse All ({customers.length})</span>
        </button>
      </div>

      {/* Primary Card Selector Display */}
      {currentCustomer ? (
        <div
          onClick={() => {
            setIsDropdownOpen((prev) => !prev);
            setTimeout(() => {
              if (inputRef.current) inputRef.current.focus();
            }, 50);
          }}
          className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/30 dark:from-indigo-950/40 dark:via-[#161719] dark:to-indigo-950/20 hover:border-indigo-400 dark:hover:border-indigo-700 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Customer Avatar */}
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(
                  currentCustomer.name,
                )} flex items-center justify-center font-bold text-xs shadow-2xs shrink-0`}
              >
                {getInitials(currentCustomer.name)}
              </div>

              {/* Customer Names & Tags */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {currentCustomer.name}
                  </span>
                  <span className="font-mono text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {currentCustomer.customerCode}
                  </span>
                  {currentCustomer.customerType && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                      {currentCustomer.customerType}
                    </span>
                  )}
                </div>

                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                  {currentCustomer.gstin || currentCustomer.gstNumber ? (
                    <span className="font-mono text-[10px] text-slate-600 dark:text-zinc-300">
                      GST: {currentCustomer.gstin || currentCustomer.gstNumber}
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 text-[10px]">
                      Unregistered (B2C)
                    </span>
                  )}
                  {currentCustomer.city && (
                    <span>
                      &bull; {currentCustomer.city}, {currentCustomer.state}
                    </span>
                  )}
                  {unbilledStats[
                    currentCustomer.id || currentCustomer.customerCode
                  ] > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      &bull;{" "}
                      {
                        unbilledStats[
                          currentCustomer.id || currentCustomer.customerCode
                        ]
                      }{" "}
                      Unbilled Trips
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Switch / Dropdown chevron */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                className="p-1 rounded-md text-slate-400 group-hover:text-slate-600 dark:group-hover:text-zinc-200 hover:bg-indigo-100/50 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Change customer"
              >
                <span className="material-symbols-outlined text-lg">
                  {isDropdownOpen ? "expand_less" : "unfold_more"}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="w-full p-3 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-white dark:bg-[#161719] text-left hover:border-indigo-500 transition-colors flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 text-xs">
            <span className="material-symbols-outlined text-lg">domain</span>
            <span>Select a Corporate Customer...</span>
          </div>
          <span className="material-symbols-outlined text-base text-slate-400">
            arrow_drop_down
          </span>
        </button>
      )}

      {/* Quick Searchable Dropdown Popover */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-white dark:bg-[#151718] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search box header inside dropdown */}
          <div className="p-2.5 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-[#181a1c] flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-base">
              search
            </span>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company name, code, GSTIN..."
              className="flex-1 bg-transparent text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                <span className="material-symbols-outlined text-sm">clear</span>
              </button>
            )}
          </div>

          {/* Quick list items */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/80 p-1">
            {quickList.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No corporate customers match your search.
              </div>
            ) : (
              quickList.map((c) => {
                const cId = c.id || c.customerCode;
                const isSelected =
                  cId === selectedCustomerId ||
                  isCustomerMatch(cId, selectedCustomerId);
                const count = unbilledStats[cId] || 0;

                return (
                  <div
                    key={cId}
                    onClick={() => {
                      onSelectCustomer(cId);
                      setIsDropdownOpen(false);
                      setSearchQuery("");
                    }}
                    className={`p-2.5 rounded-lg flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200"
                        : "hover:bg-slate-50 dark:hover:bg-zinc-800/60 text-slate-800 dark:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getAvatarColor(
                          c.name,
                        )} flex items-center justify-center font-bold text-[11px] shrink-0`}
                      >
                        {getInitials(c.name)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs truncate">
                            {c.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400">
                            ({c.customerCode})
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate flex items-center gap-1.5">
                          <span>{c.city || "Corporate"}</span>
                          {c.gstin && (
                            <span className="font-mono">&bull; {c.gstin}</span>
                          )}
                          {Number(c.outstandingAmount || 0) > 0 && (
                            <span className="text-amber-600 dark:text-amber-400 font-mono">
                              &bull; Due: {formatINR(c.outstandingAmount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {count > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {count} Trips
                        </span>
                      )}
                      {isSelected && (
                        <span className="material-symbols-outlined text-base text-indigo-600 dark:text-indigo-400 font-bold">
                          check
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom trigger to open full drawer */}
          <div className="p-2 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-[#161719] flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              {quickList.length} customers available
            </span>
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(false);
                setIsDrawerOpen(true);
              }}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">
                open_in_new
              </span>
              <span>Open Customer Drawer & Directory</span>
            </button>
          </div>
        </div>
      )}

      {/* Full Stylish Customer Slide-Over Drawer */}
      <CorporateCustomerDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        customers={customers}
        trips={trips}
        invoices={invoices}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={(cId) => {
          onSelectCustomer(cId);
          setIsDrawerOpen(false);
        }}
      />
    </div>
  );
}
