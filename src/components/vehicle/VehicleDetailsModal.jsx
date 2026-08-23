import { forwardRef } from "react";
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "../ui/Modal";
import Button from "../ui/Button";
import { getVehicleDocumentStatus } from "../../utils/vehicleDocumentStatus";
import {
  VEHICLE_TYPE_LABELS,
  FUEL_TYPE_LABELS,
  OWNERSHIP_TYPE_LABELS,
} from "../../constants/vehicles";

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  return value;
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }
  return `${day}/${month}/${year}`;
};

function DetailItem({ label, value, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="mt-1 break-words text-sm text-foreground">
        {children || formatValue(value)}
      </div>
    </div>
  );
}

function DetailSection({ title, children, className = "" }) {
  return (
    <section className={className}>
      <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1.5">
        {title}
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

const STATUS_BADGES = {
  valid: "bg-success/10 text-success border border-success/20",
  expiring_soon: "bg-warning/10 text-warning border border-warning/20",
  expired: "bg-error/10 text-error border border-error/20",
  not_provided: "bg-muted/20 text-muted border border-border",
};

function DocItem({ name, certNo, expiryDate, evaluation }) {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-border bg-surface/50 p-3.5 overflow-hidden">
      <div>
        <div className="flex items-start justify-between gap-1.5 min-h-[28px]">
          <span className="text-xs font-semibold text-foreground leading-snug">
            {name}
          </span>
          {evaluation && (
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap ${
                STATUS_BADGES[evaluation.status] || STATUS_BADGES.not_provided
              }`}
            >
              {evaluation.label}
            </span>
          )}
        </div>

        <div className="mt-3 space-y-1 text-xs">
          {certNo !== undefined && (
            <div className="flex items-center justify-between gap-1 text-muted">
              <span>Doc No:</span>
              <span className="font-mono text-foreground font-medium truncate max-w-[120px]">
                {formatValue(certNo)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between gap-1 text-muted">
            <span>Expiry:</span>
            <span className="font-medium text-foreground">
              {formatDate(expiryDate)}
            </span>
          </div>
        </div>
      </div>

      {evaluation?.message && (
        <p className="mt-2.5 pt-2 border-t border-border/60 text-[11px] text-muted italic">
          {evaluation.message}
        </p>
      )}
    </div>
  );
}

const VehicleDetailsModal = forwardRef(function VehicleDetailsModal(
  { open, vehicle, onClose, onEdit },
  ref,
) {
  if (!vehicle) {
    return null;
  }

  const docStatus = getVehicleDocumentStatus(vehicle);
  const typeLabel =
    VEHICLE_TYPE_LABELS[vehicle.vehicleType] || vehicle.vehicleType || "—";
  const fuelLabel =
    FUEL_TYPE_LABELS[vehicle.fuelType] || vehicle.fuelType || "—";
  const ownershipLabel =
    OWNERSHIP_TYPE_LABELS[vehicle.ownershipType] ||
    vehicle.ownershipType ||
    "—";

  const getDocEval = (name) =>
    docStatus.evaluations?.find((e) =>
      e.name.toLowerCase().includes(name.toLowerCase()),
    );

  return (
    <Modal ref={ref} open={open} onClose={onClose} className="max-w-4xl">
      <ModalHeader>
        <div className="min-w-0">
          <ModalTitle>{vehicle.vehicleNumber}</ModalTitle>
          <ModalDescription>
            {vehicle.vehicleCode}
            {" · "}
            {typeLabel}
            {" · "}
            {vehicle.isActive ? (
              <span className="text-success font-medium">Active</span>
            ) : (
              <span className="text-muted font-medium">Inactive</span>
            )}
          </ModalDescription>
        </div>
        <ModalClose onClose={onClose} />
      </ModalHeader>

      <ModalContent>
        <div className="space-y-6">
          {/* Vehicle Information */}
          <DetailSection title="Vehicle Information">
            <DetailItem label="Vehicle Code" value={vehicle.vehicleCode} />
            <DetailItem label="Vehicle Number" value={vehicle.vehicleNumber} />
            <DetailItem label="Vehicle Type" value={typeLabel} />
            <DetailItem
              label="Registration Date"
              value={formatDate(vehicle.registrationDate)}
            />
            <DetailItem label="Make / Manufacturer" value={vehicle.make} />
            <DetailItem label="Model" value={vehicle.model} />
            <DetailItem
              label="Manufacturing Year"
              value={vehicle.manufacturingYear}
            />
            <DetailItem
              label="Seating Capacity"
              value={
                vehicle.seatingCapacity
                  ? `${vehicle.seatingCapacity} Passengers`
                  : "—"
              }
            />
            <DetailItem label="Fuel Type" value={fuelLabel} />
            <DetailItem label="Status">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  vehicle.isActive
                    ? "bg-success/10 text-success border border-success/20"
                    : "bg-muted/20 text-muted border border-border"
                }`}
              >
                {vehicle.isActive ? "Active" : "Inactive"}
              </span>
            </DetailItem>
          </DetailSection>

          {/* Ownership Information */}
          <DetailSection title="Ownership Information">
            <DetailItem label="Ownership Type" value={ownershipLabel} />
            {(vehicle.ownershipType === "attached" ||
              vehicle.ownershipType === "leased") && (
              <>
                <DetailItem label="Owner Name" value={vehicle.ownerName} />
                <DetailItem
                  label="Owner Contact"
                  value={vehicle.ownerContact}
                />
              </>
            )}
          </DetailSection>

          {/* Compliance & Document Information */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-1.5">
              <h3 className="text-sm font-semibold text-foreground">
                Document & Compliance Information
              </h3>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
                  STATUS_BADGES[docStatus.value] || STATUS_BADGES.not_provided
                }`}
              >
                Overall: {docStatus.label}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DocItem
                name="Insurance"
                certNo={vehicle.insuranceNumber}
                expiryDate={vehicle.insuranceExpiry}
                evaluation={getDocEval("Insurance")}
              />
              <DocItem
                name="Fitness Certificate"
                certNo={vehicle.fitnessCertificateNumber}
                expiryDate={vehicle.fitnessExpiry}
                evaluation={getDocEval("Fitness")}
              />
              <DocItem
                name="PUC Certificate"
                certNo={vehicle.pucNumber}
                expiryDate={vehicle.pucExpiry}
                evaluation={getDocEval("PUC")}
              />
              <DocItem
                name="Permit"
                certNo={vehicle.permitNumber}
                expiryDate={vehicle.permitExpiry}
                evaluation={getDocEval("Permit")}
              />
            </div>
          </div>

          {/* Additional Notes & Audit Information */}
          <DetailSection title="Additional Notes & Audit">
            <div className="col-span-full">
              <p className="text-xs font-medium text-muted">Notes</p>
              <p className="mt-1 text-sm text-foreground whitespace-pre-wrap rounded-md bg-surface/50 border border-border p-3 min-h-[50px]">
                {vehicle.notes || "No notes entered."}
              </p>
            </div>
            <DetailItem
              label="Record Created"
              value={
                vehicle.createdAt
                  ? new Date(vehicle.createdAt).toLocaleString("en-IN")
                  : "—"
              }
            />
            <DetailItem
              label="Last Updated"
              value={
                vehicle.updatedAt
                  ? new Date(vehicle.updatedAt).toLocaleString("en-IN")
                  : "—"
              }
            />
          </DetailSection>
        </div>
      </ModalContent>

      <ModalFooter className="flex items-center justify-between sm:justify-between">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            onClose();
            onEdit(vehicle);
          }}
        >
          Edit Vehicle
        </Button>
      </ModalFooter>
    </Modal>
  );
});

export default VehicleDetailsModal;
