export default function TripSummaryCard({ trip, vehicle, driver, onViewTrip }) {
  if (!trip) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
            TRIP SUMMARY
          </span>
        </div>
        <div className="py-6 text-center text-xs text-muted">
          No trip details loaded
        </div>
      </div>
    );
  }

  const tripCode = trip.tripCode || "TRP-—";
  const routeDisplay =
    trip.pickupLocation && trip.dropLocation
      ? `${trip.pickupLocation} → ${trip.dropLocation}`
      : trip.route || "Corridor Transit";

  const vehicleDisplay = vehicle
    ? `${vehicle.vehicleNumber || vehicle.vehicleCode}${vehicle.make ? ` (${vehicle.make})` : ""}`
    : "Unassigned Vehicle";

  const driverDisplay = driver ? driver.name : "Unassigned Driver";

  const distanceDisplay =
    trip.totalKm !== null && trip.totalKm !== undefined && trip.totalKm > 0
      ? `${Number(trip.totalKm).toLocaleString("en-IN")} km`
      : trip.closingKm && trip.openingKm
        ? `${(Number(trip.closingKm) - Number(trip.openingKm)).toLocaleString("en-IN")} km`
        : "—";

  const durationDisplay = trip.duration || "—";

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
          TRIP SUMMARY
        </span>
        {onViewTrip && (
          <button
            type="button"
            onClick={onViewTrip}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <span>View Trip</span>
            <span className="material-symbols-outlined text-[14px]">
              open_in_new
            </span>
          </button>
        )}
      </div>

      {/* Trip Header */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
          <span className="material-symbols-outlined text-[20px]">route</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-foreground">
              {tripCode}
            </span>
          </div>
          <p className="truncate text-xs font-medium text-muted">
            {routeDisplay}
          </p>
        </div>
      </div>

      {/* 2-Column Details Grid */}
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div>
          <span className="block font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
            Vehicle
          </span>
          <span className="mt-0.5 block truncate text-xs font-semibold text-foreground">
            {vehicleDisplay}
          </span>
        </div>

        <div>
          <span className="block font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
            Driver
          </span>
          <span className="mt-0.5 block truncate text-xs font-semibold text-foreground">
            {driverDisplay}
          </span>
        </div>

        <div>
          <span className="block font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
            Distance
          </span>
          <span className="mt-0.5 block text-xs font-semibold text-foreground">
            {distanceDisplay}
          </span>
        </div>

        <div>
          <span className="block font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
            Duration
          </span>
          <span className="mt-0.5 block text-xs font-semibold text-foreground">
            {durationDisplay}
          </span>
        </div>
      </div>
    </div>
  );
}
