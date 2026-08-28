export default function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-label="Loading Dashboard">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-[#27272a]/80">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 dark:bg-zinc-800 rounded" />
          <div className="h-3.5 w-64 bg-slate-200 dark:bg-zinc-800 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-8.5 w-24 bg-slate-200 dark:bg-zinc-800 rounded" />
          <div className="h-8.5 w-28 bg-slate-200 dark:bg-zinc-800 rounded" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={`kpi_skel_${i}`}
            className="p-4 rounded-xl bg-white dark:bg-[#18191b] border border-slate-200/80 dark:border-[#27272a] space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-slate-200 dark:bg-zinc-800 rounded" />
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-zinc-800" />
            </div>
            <div className="h-7 w-24 bg-slate-200 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-28 bg-slate-200 dark:bg-zinc-800 rounded" />
          </div>
        ))}
      </div>

      {/* Two Column Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 h-72 rounded-xl bg-white dark:bg-[#18191b] border border-slate-200/80 dark:border-[#27272a] p-4 space-y-4">
          <div className="h-4 w-36 bg-slate-200 dark:bg-zinc-800 rounded" />
          <div className="space-y-3 pt-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={`row_skel_${i}`}
                className="h-12 bg-slate-100 dark:bg-[#121314] rounded-lg"
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 h-72 rounded-xl bg-white dark:bg-[#18191b] border border-slate-200/80 dark:border-[#27272a] p-4 space-y-4">
          <div className="h-4 w-36 bg-slate-200 dark:bg-zinc-800 rounded" />
          <div className="space-y-3 pt-2">
            {[...Array(2)].map((_, i) => (
              <div
                key={`alert_skel_${i}`}
                className="h-16 bg-slate-100 dark:bg-[#121314] rounded-lg"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Billing Snapshot Skeleton */}
      <div className="h-44 rounded-xl bg-white dark:bg-[#18191b] border border-slate-200/80 dark:border-[#27272a] p-4 space-y-4">
        <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-800 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={`bill_skel_${i}`}
              className="h-20 bg-slate-100 dark:bg-[#121314] rounded-lg"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
