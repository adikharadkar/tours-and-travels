import { formatPeriodTitle } from "./calendarUtils";

export default function CalendarHeader({
  currentDate,
  viewMode, // 'day' | 'week' | 'month'
  onViewModeChange,
  scheduleMode, // 'trips' | 'vehicles' | 'drivers'
  onScheduleModeChange,
  onPrev,
  onNext,
  onToday,
  onSelectPreset,
}) {
  const periodTitle = formatPeriodTitle(viewMode, currentDate);

  const prevAriaLabel =
    viewMode === "month"
      ? "Previous month"
      : viewMode === "week"
        ? "Previous week"
        : "Previous day";

  const nextAriaLabel =
    viewMode === "month"
      ? "Next month"
      : viewMode === "week"
        ? "Next week"
        : "Next day";

  return (
    <div className="space-y-4">
      {/* Top Bar: Title + Schedule Mode Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Trip Calendar
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40">
              Dispatch & Resource Planning
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Plan trips, resource schedules and operational conflicts.
          </p>
        </div>

        {/* Schedule Mode Selector: Trips / Vehicles / Drivers */}
        <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-[#121318] border border-slate-200 dark:border-[#262837] shrink-0">
          <button
            type="button"
            aria-label="View Trips Schedule"
            onClick={() => onScheduleModeChange("trips")}
            className={[
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
              scheduleMode === "trips"
                ? "bg-white dark:bg-[#1f212d] text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
            ].join(" ")}
          >
            <span className="material-symbols-outlined text-[16px] text-cyan-600 dark:text-cyan-400">
              calendar_view_week
            </span>
            <span>Trips</span>
          </button>

          <button
            type="button"
            aria-label="View Vehicles Schedule"
            onClick={() => onScheduleModeChange("vehicles")}
            className={[
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
              scheduleMode === "vehicles"
                ? "bg-white dark:bg-[#1f212d] text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
            ].join(" ")}
          >
            <span className="material-symbols-outlined text-[16px] text-violet-600 dark:text-violet-400">
              directions_car
            </span>
            <span>Vehicles</span>
          </button>

          <button
            type="button"
            aria-label="View Drivers Schedule"
            onClick={() => onScheduleModeChange("drivers")}
            className={[
              "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
              scheduleMode === "drivers"
                ? "bg-white dark:bg-[#1f212d] text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
            ].join(" ")}
          >
            <span className="material-symbols-outlined text-[16px] text-emerald-600 dark:text-emerald-400">
              badge
            </span>
            <span>Drivers</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & View Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-[#161822] rounded-xl border border-slate-200 dark:border-[#262837] shadow-xs">
        {/* Left: Prev / Today / Next & Period Title */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#121318] p-0.5">
            <button
              type="button"
              aria-label={prevAriaLabel}
              onClick={onPrev}
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#1f212d] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_left
              </span>
            </button>

            <button
              type="button"
              aria-label="Today"
              onClick={onToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#1f212d] rounded-md transition-colors cursor-pointer"
            >
              Today
            </button>

            <button
              type="button"
              aria-label={nextAriaLabel}
              onClick={onNext}
              className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#1f212d] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_right
              </span>
            </button>
          </div>

          <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight font-mono">
            {periodTitle}
          </div>
        </div>

        {/* Right: Quick Presets + Day/Week/Month Switcher */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Quick Presets for fast jumping */}
          <div className="hidden lg:flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => onSelectPreset?.("tomorrow")}
              className="px-2 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f212d] rounded transition-colors"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset?.("this_week")}
              className="px-2 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f212d] rounded transition-colors"
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => onSelectPreset?.("next_7_days")}
              className="px-2 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f212d] rounded transition-colors"
            >
              Next 7 Days
            </button>
          </div>

          {/* View Toggles: Day | Week | Month */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-[#121318] border border-slate-200 dark:border-[#262837]">
            {["day", "week", "month"].map((mode) => {
              const isActive = viewMode === mode;
              const label = mode.charAt(0).toUpperCase() + mode.slice(1);
              return (
                <button
                  key={mode}
                  type="button"
                  aria-label={`${label} view`}
                  onClick={() => onViewModeChange(mode)}
                  className={[
                    "px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer capitalize",
                    isActive
                      ? "bg-white dark:bg-[#1f212d] text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
