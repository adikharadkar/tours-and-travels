export default function CalendarHealthBar({
  metrics = {
    scheduledToday: 0,
    inProgress: 0,
    unassigned: 0,
    conflictsCount: 0,
  },
  activeFilter, // null | 'today' | 'in_progress' | 'unassigned' | 'conflicts'
  onSelectMetricFilter,
}) {
  const items = [
    {
      id: "today",
      label: "Scheduled Today",
      value: metrics.scheduledToday,
      icon: "calendar_today",
      colorClass: "text-violet-600 dark:text-violet-400",
      bgClass:
        "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800/40",
      ringClass: "ring-2 ring-violet-500/30 border-violet-500",
    },
    {
      id: "in_progress",
      label: "In Progress",
      value: metrics.inProgress,
      icon: "near_me",
      colorClass: "text-cyan-600 dark:text-cyan-400",
      bgClass:
        "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/40",
      ringClass: "ring-2 ring-cyan-500/30 border-cyan-500",
    },
    {
      id: "unassigned",
      label: "Unassigned",
      value: metrics.unassigned,
      icon: "person_off",
      colorClass:
        metrics.unassigned > 0
          ? "text-amber-600 dark:text-amber-400"
          : "text-slate-600 dark:text-slate-400",
      bgClass:
        metrics.unassigned > 0
          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40"
          : "bg-slate-50 dark:bg-[#161822] border-slate-200 dark:border-[#262837]",
      ringClass: "ring-2 ring-amber-500/30 border-amber-500",
      badge: metrics.unassigned > 0 ? "Needs Fleet" : null,
    },
    {
      id: "conflicts",
      label: "Conflicts",
      value: metrics.conflictsCount,
      icon: "warning",
      colorClass:
        metrics.conflictsCount > 0
          ? "text-rose-600 dark:text-rose-400"
          : "text-emerald-600 dark:text-emerald-400",
      bgClass:
        metrics.conflictsCount > 0
          ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40"
          : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/30",
      ringClass: "ring-2 ring-rose-500/30 border-rose-500",
      badge: metrics.conflictsCount > 0 ? "Overlaps" : "All Clear",
    },
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
          Schedule Health
        </span>
        {activeFilter && (
          <button
            type="button"
            onClick={() => onSelectMetricFilter(null)}
            className="text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
          >
            Clear Metric Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {items.map((item) => {
          const isSelected = activeFilter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectMetricFilter(isSelected ? null : item.id)}
              aria-label={`${item.label}: ${item.value}`}
              className={[
                "flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none bg-white dark:bg-[#161822]",
                isSelected
                  ? item.ringClass
                  : "border-slate-200 dark:border-[#262837] hover:border-slate-300 dark:hover:border-[#3a3f55] shadow-2xs",
              ].join(" ")}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${item.bgClass} ${item.colorClass}`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {item.icon}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                    {item.label}
                  </div>
                  <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 font-mono leading-none mt-0.5">
                    {item.value}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span
                  className={[
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 hidden sm:inline-block",
                    item.id === "conflicts" && metrics.conflictsCount === 0
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : item.id === "conflicts"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold animate-pulse"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
                  ].join(" ")}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
