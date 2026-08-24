export default function SidebarInsights({
  activeCount = 124,
  alertCount = 3,
  isCollapsed,
}) {
  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2 py-1">
        <div
          title={`Active: ${activeCount} | Alerts: ${alertCount}`}
          className="w-9 h-9 rounded-lg bg-[#f8fafc] dark:bg-[#0f1117] border border-[#e2e8f0] dark:border-white/5 flex items-center justify-center text-xs font-bold text-[#00687a] dark:text-[#4cd7f6]"
        >
          {activeCount > 99 ? "99+" : activeCount}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Active Stat Card */}
      <div className="bg-[#f8fafc] dark:bg-[#0f1117] rounded-lg border border-[#e2e8f0] dark:border-white/5 p-3 flex flex-col items-start shadow-xs transition-colors">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] dark:text-[#8e909c] mb-1">
          Active
        </span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#57dffe] dark:bg-[#4cd7f6] relative shrink-0">
            <div className="absolute inset-0 bg-[#57dffe] dark:bg-[#4cd7f6] rounded-full animate-ping opacity-75" />
          </div>
          <span className="text-base font-bold text-[#0f172a] dark:text-[#4cd7f6]">
            {activeCount}
          </span>
        </div>
      </div>

      {/* Alerts Stat Card */}
      <div className="bg-[#f8fafc] dark:bg-[#0f1117] rounded-lg border border-[#e2e8f0] dark:border-white/5 p-3 flex flex-col items-start shadow-xs transition-colors">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] dark:text-[#8e909c] mb-1">
          Alerts
        </span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#a76500] dark:bg-[#ffb4ab] shrink-0" />
          <span className="text-base font-bold text-[#a76500] dark:text-[#ffb4ab]">
            {alertCount}
          </span>
        </div>
      </div>
    </div>
  );
}
