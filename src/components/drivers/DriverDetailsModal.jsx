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
import {
  getDriverLicenseStatus,
  isDriverEligible,
} from "../../utils/driverLicenseStatus";
import {
  DRIVER_TYPE_LABELS,
  PREFIX_LABELS,
  LICENSE_TYPE_LABELS,
} from "../../constants/drivers";
import { states } from "../../constants/india";
import formatValue from "../../utils/formatValue";

const formatDate = (value) => {
  if (!value) {
    return "—";
  }
  const parts = value.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return value;
};

const calculateAge = (dobString) => {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? `${age} years` : null;
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

const DriverDetailsModal = forwardRef(function DriverDetailsModal(
  { open, driver, onClose, onEdit },
  ref,
) {
  if (!driver) {
    return null;
  }

  const licenseStatus = getDriverLicenseStatus(driver);
  const eligibleForTrips = isDriverEligible(driver);

  const prefixLabel = PREFIX_LABELS[driver.prefix] || "";
  const fullDisplayName = prefixLabel
    ? `${prefixLabel} ${driver.name}`
    : driver.name;

  const driverTypeLabel =
    DRIVER_TYPE_LABELS[driver.driverType] || driver.driverType || "—";
  const licenseTypeLabel =
    LICENSE_TYPE_LABELS[driver.licenseType] || driver.licenseType || "—";

  // Match state and city labels
  const stateObj = states.find((s) => s.value === driver.state);
  const stateName = stateObj?.label || driver.state || "—";
  const cityObj = stateObj?.cities?.find((c) => c.value === driver.city);
  const cityName = cityObj?.label || driver.city || "—";

  const age = calculateAge(driver.dateOfBirth);

  return (
    <Modal ref={ref} open={open} onClose={onClose} className="max-w-4xl">
      <ModalHeader>
        <div className="min-w-0">
          <ModalTitle>{fullDisplayName}</ModalTitle>
          <ModalDescription>
            {driver.driverCode}
            {" · "}
            {driverTypeLabel} Driver
            {" · "}
            {driver.isActive !== false ? (
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
          {/* Eligibility Banner */}
          <div
            className={`flex items-center justify-between rounded-lg border p-3.5 ${
              eligibleForTrips
                ? "border-success/30 bg-success/5 text-success"
                : "border-warning/30 bg-warning/5 text-warning"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">{eligibleForTrips ? "✅" : "⚠️"}</span>
              <div>
                <p className="text-sm font-semibold">
                  Trip Assignment Status:{" "}
                  {eligibleForTrips ? "Eligible" : "Not Eligible"}
                </p>
                <p className="text-xs opacity-90">
                  {driver.isActive === false
                    ? "Driver is set to Inactive master status."
                    : licenseStatus.value === "expired"
                      ? "Driving license is expired. Cannot be assigned to new trips."
                      : "Driver is active with a valid driving license."}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                eligibleForTrips
                  ? "bg-success/20 text-success border border-success/30"
                  : "bg-error/20 text-error border border-error/30"
              }`}
            >
              {eligibleForTrips ? "Ready For Trips" : "Ineligible"}
            </span>
          </div>

          {/* Section 1: Personal Information */}
          <DetailSection title="1. Personal Information">
            <DetailItem label="Driver Code" value={driver.driverCode} />
            <DetailItem label="Driver Name" value={fullDisplayName} />
            <DetailItem label="Date of Birth">
              <span>{formatDate(driver.dateOfBirth)}</span>
              {age && <span className="ml-1.5 text-muted">({age})</span>}
            </DetailItem>
            <DetailItem label="Master Status">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  driver.isActive !== false
                    ? "bg-success/10 text-success border border-success/20"
                    : "bg-muted/20 text-muted border border-border"
                }`}
              >
                {driver.isActive !== false ? "Active" : "Inactive"}
              </span>
            </DetailItem>
          </DetailSection>

          {/* Section 2: Driving License Information */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-1.5">
              <h3 className="text-sm font-semibold text-foreground">
                2. Driving License Information
              </h3>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
                  STATUS_BADGES[licenseStatus.value] ||
                  STATUS_BADGES.not_provided
                }`}
              >
                License: {licenseStatus.label}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
              <DetailItem label="License Number">
                <span className="font-mono font-bold text-foreground">
                  {driver.licenseNumber}
                </span>
              </DetailItem>

              <DetailItem label="License Type" value={licenseTypeLabel} />

              <DetailItem
                label="License Issue Date"
                value={formatDate(driver.licenseIssueDate)}
              />

              <DetailItem label="License Expiry Date">
                <span className="font-semibold text-foreground">
                  {formatDate(driver.licenseExpiryDate)}
                </span>
              </DetailItem>

              <DetailItem
                label="Issuing Authority / RTO"
                value={driver.issuingAuthority}
              />

              <DetailItem label="License Status Notice">
                <p className="text-xs italic text-muted">
                  {licenseStatus.message}
                </p>
              </DetailItem>
            </div>
          </div>

          {/* Section 3: Contact Information */}
          <DetailSection title="3. Contact Information">
            <DetailItem label="Primary Mobile">
              <span className="font-mono font-medium">
                {driver.mobile || "—"}
              </span>
            </DetailItem>

            <DetailItem label="Alternate Mobile">
              <span className="font-mono">{driver.alternateMobile || "—"}</span>
            </DetailItem>

            <DetailItem label="Email Address" value={driver.email} />

            <div className="col-span-full sm:col-span-2">
              <DetailItem label="Residential Address" value={driver.address} />
            </div>

            <DetailItem label="City" value={cityName} />
            <DetailItem label="State" value={stateName} />
            <DetailItem label="PIN Code" value={driver.pinCode} />
          </DetailSection>

          {/* Section 4: Employment Information */}
          <DetailSection title="4. Employment Information">
            <DetailItem label="Driver Type" value={driverTypeLabel} />

            <DetailItem
              label="Joining Date"
              value={formatDate(driver.joiningDate)}
            />

            <DetailItem
              label="Employee / Reference ID"
              value={driver.employeeReferenceId}
            />

            <DetailItem label="Daily Rate">
              {driver.dailyRate !== null &&
              driver.dailyRate !== undefined &&
              driver.dailyRate !== "" ? (
                <span className="font-semibold text-foreground">
                  ₹{Number(driver.dailyRate).toLocaleString("en-IN")} / day
                </span>
              ) : (
                "—"
              )}
            </DetailItem>
          </DetailSection>

          {/* Section 5: Notes & Audit Information */}
          <DetailSection title="5. Additional Notes & System Audit">
            <div className="col-span-full">
              <p className="text-xs font-medium text-muted">Notes</p>
              <p className="mt-1 text-sm text-foreground whitespace-pre-wrap rounded-md bg-surface/50 border border-border p-3 min-h-[48px]">
                {driver.notes || "No additional notes entered."}
              </p>
            </div>

            <DetailItem
              label="Record Created"
              value={
                driver.createdAt
                  ? new Date(driver.createdAt).toLocaleString("en-IN")
                  : "—"
              }
            />

            <DetailItem
              label="Last Updated"
              value={
                driver.updatedAt
                  ? new Date(driver.updatedAt).toLocaleString("en-IN")
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
            onEdit(driver);
          }}
        >
          Edit Driver
        </Button>
      </ModalFooter>
    </Modal>
  );
});

export default DriverDetailsModal;
