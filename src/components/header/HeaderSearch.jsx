import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { executeGlobalSearch } from "../../services/globalSearchService";

export default function HeaderSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [results, setResults] = useState({
    customers: [],
    vehicles: [],
    drivers: [],
    trips: [],
    totalMatches: 0,
  });

  const searchInputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const containerRef = useRef(null);

  // Global keyboard shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setIsMobileSearchOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 50);
        } else {
          searchInputRef.current?.focus();
          setIsOpen(true);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setIsMobileSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Run search query
  useEffect(() => {
    if (query.trim().length > 0) {
      const searchRes = executeGlobalSearch(query);
      setResults(searchRes);
      setIsOpen(true);
    } else {
      setResults({
        customers: [],
        vehicles: [],
        drivers: [],
        trips: [],
        totalMatches: 0,
      });
    }
  }, [query]);

  // Click outside to close results dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (link) => {
    setIsOpen(false);
    setIsMobileSearchOpen(false);
    setQuery("");
    navigate(link);
  };

  const hasAnyResults = results.totalMatches > 0;

  return (
    <>
      {/* Desktop Search Bar */}
      <div
        ref={containerRef}
        className="relative hidden md:block w-full max-w-sm lg:max-w-md mx-4"
      >
        <div className="relative group">
          {/* Left search icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748b] dark:text-[#cbc3d7]/70 group-focus-within:text-[#6b38d4] dark:group-focus-within:text-[#d0bcff] transition-colors">
            <span className="material-symbols-outlined text-[18px]">
              search
            </span>
          </div>

          {/* Search input */}
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim().length > 0) setIsOpen(true);
            }}
            placeholder="Search FleetCore..."
            className={[
              "w-full pl-9 pr-14 py-2 text-sm rounded-lg border transition-all outline-none",
              // Light theme
              "bg-[#f8fafc] border-[#e2e8f0] text-[#0f172a] placeholder-[#94a3b8]",
              "focus:bg-white focus:border-[#6b38d4] focus:ring-2 focus:ring-[#6b38d4]/15 shadow-xs",
              // Dark theme
              "dark:bg-[#0f1117] dark:border-white/10 dark:text-[#e2e2eb] dark:placeholder-[#cbc3d7]/40",
              "dark:focus:border-[#d0bcff] dark:focus:ring-2 dark:focus:ring-[#a078ff]/20",
            ].join(" ")}
          />

          {/* Right keyboard shortcut badge */}
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="px-1.5 py-0.5 rounded border border-[#e2e8f0] dark:border-white/10 bg-[#f1f5f9] dark:bg-[#33343b]/40 text-[10px] font-mono font-semibold text-[#64748b] dark:text-[#cbc3d7]/70">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Global Search Dropdown */}
        {isOpen && query.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white dark:bg-[#1a1d26] border border-[#e2e8f0] dark:border-white/10 rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-50 max-h-[380px] overflow-y-auto p-2 animate-in fade-in zoom-in-95 duration-150">
            {hasAnyResults ? (
              <div className="space-y-3">
                {/* Customers Section */}
                {results.customers.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] dark:text-[#cbc3d7]/60 px-2 py-1">
                      Customers ({results.customers.length})
                    </div>
                    <div className="space-y-1">
                      {results.customers.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectResult(item.link)}
                          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#33343b]/50 transition-colors flex items-center gap-2.5 group cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#eaedff] dark:bg-[#6b38d4]/20 text-[#6b38d4] dark:text-[#d0bcff] flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[16px]">
                              {item.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-[#0f172a] dark:text-[#e2e2eb] truncate group-hover:text-[#6b38d4] dark:group-hover:text-[#d0bcff]">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-[#64748b] dark:text-[#cbc3d7]/70 truncate">
                              {item.subtitle}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vehicles Section */}
                {results.vehicles.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] dark:text-[#cbc3d7]/60 px-2 py-1">
                      Vehicles ({results.vehicles.length})
                    </div>
                    <div className="space-y-1">
                      {results.vehicles.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectResult(item.link)}
                          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#33343b]/50 transition-colors flex items-center gap-2.5 group cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#e0f2fe] dark:bg-[#0284c7]/20 text-[#0284c7] dark:text-[#38bdf8] flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[16px]">
                              {item.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-[#0f172a] dark:text-[#e2e2eb] truncate group-hover:text-[#6b38d4] dark:group-hover:text-[#d0bcff]">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-[#64748b] dark:text-[#cbc3d7]/70 truncate">
                              {item.subtitle}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drivers Section */}
                {results.drivers.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] dark:text-[#cbc3d7]/60 px-2 py-1">
                      Drivers ({results.drivers.length})
                    </div>
                    <div className="space-y-1">
                      {results.drivers.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectResult(item.link)}
                          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#33343b]/50 transition-colors flex items-center gap-2.5 group cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#fef3c7] dark:bg-[#d97706]/20 text-[#d97706] dark:text-[#fbbf24] flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[16px]">
                              {item.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-[#0f172a] dark:text-[#e2e2eb] truncate group-hover:text-[#6b38d4] dark:group-hover:text-[#d0bcff]">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-[#64748b] dark:text-[#cbc3d7]/70 truncate">
                              {item.subtitle}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trips Section */}
                {results.trips.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] dark:text-[#cbc3d7]/60 px-2 py-1">
                      Trips ({results.trips.length})
                    </div>
                    <div className="space-y-1">
                      {results.trips.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectResult(item.link)}
                          className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#33343b]/50 transition-colors flex items-center gap-2.5 group cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-md bg-[#dcfce7] dark:bg-[#16a34a]/20 text-[#16a34a] dark:text-[#4ade80] flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[16px]">
                              {item.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-[#0f172a] dark:text-[#e2e2eb] truncate group-hover:text-[#6b38d4] dark:group-hover:text-[#d0bcff]">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-[#64748b] dark:text-[#cbc3d7]/70 truncate">
                              {item.subtitle}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#64748b] dark:text-[#cbc3d7]/70">
                No matching records found for "{query}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Search Button */}
      <button
        type="button"
        onClick={() => {
          setIsMobileSearchOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 50);
        }}
        aria-label="Search FleetCore"
        className="md:hidden p-2 rounded-full text-[#64748b] hover:text-[#6b38d4] hover:bg-[#f1f5f9] dark:text-[#cbc3d7] dark:hover:text-[#d0bcff] dark:hover:bg-[#33343b]/50 transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">search</span>
      </button>

      {/* Mobile Search Modal Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col p-4 md:hidden">
          <div className="bg-white dark:bg-[#1a1d26] rounded-xl border border-[#e2e8f0] dark:border-white/10 p-3 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#6b38d4] dark:text-[#d0bcff] text-[20px]">
                search
              </span>
              <input
                ref={mobileInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search FleetCore..."
                className="flex-1 bg-transparent border-none text-sm text-[#0f172a] dark:text-[#e2e2eb] outline-none"
              />
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className="p-1 rounded text-[#64748b] dark:text-[#cbc3d7]"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            {/* Mobile Results */}
            {query.trim().length > 0 && (
              <div className="mt-3 border-t border-[#e2e8f0] dark:border-white/10 pt-2 max-h-[60vh] overflow-y-auto space-y-2">
                {hasAnyResults ? (
                  <>
                    {[
                      ...results.customers,
                      ...results.vehicles,
                      ...results.drivers,
                      ...results.trips,
                    ].map((item) => (
                      <button
                        key={`${item.category}-${item.id}`}
                        type="button"
                        onClick={() => handleSelectResult(item.link)}
                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#33343b]/50 flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#6b38d4] dark:text-[#d0bcff]">
                          {item.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-[#0f172a] dark:text-[#e2e2eb] truncate">
                            {item.title}
                          </div>
                          <div className="text-[10px] text-[#64748b] dark:text-[#cbc3d7]/70 truncate">
                            {item.category}: {item.subtitle}
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="py-4 text-center text-xs text-[#64748b] dark:text-[#cbc3d7]">
                    No matches found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
