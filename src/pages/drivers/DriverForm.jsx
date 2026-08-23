import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card, {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import FormField from "../../components/ui/FormField";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Switch from "../../components/ui/Switch";
import Textarea from "../../components/ui/Textarea";
import Toast from "../../components/ui/Toast";

import {
  LICENSE_TYPES,
  DRIVER_TYPES,
  DRIVER_PREFIXES,
} from "../../constants/drivers";
import { states } from "../../constants/india";
import {
  saveDriver,
  updateDriver,
  getDriverById,
} from "../../services/driverService";
import { validateDriver } from "../../utils/validation/driverValidation";
import { getDriverLicenseStatus } from "../../utils/driverLicenseStatus";

const initialFormData = {
  driverCode: "Will be generated automatically",
  prefix: "mr",
  name: "",
  dateOfBirth: "",

  mobile: "",
  alternateMobile: "",
  email: "",
  address: "",
  state: "",
  city: "",
  pinCode: "",

  licenseNumber: "",
  licenseType: "commercial",
  licenseIssueDate: "",
  licenseExpiryDate: "",
  issuingAuthority: "",

  driverType: "own",
  joiningDate: "",
  employeeReferenceId: "",
  dailyRate: "",

  isActive: true,
  notes: "",
};

export default function DriverForm() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(driverId);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!driverId) return;

    const existingDriver = getDriverById(driverId);
    if (!existingDriver) {
      navigate("/drivers", { replace: true });
      return;
    }

    setFormData({
      ...initialFormData,
      ...existingDriver,
      dailyRate:
        existingDriver.dailyRate !== null &&
        existingDriver.dailyRate !== undefined
          ? String(existingDriver.dailyRate)
          : "",
      isActive: existingDriver.isActive !== false,
    });
    setErrors({});
  }, [driverId, navigate]);

  const cityOptions = useMemo(() => {
    const selectedState = states.find((s) => s.value === formData.state);
    return selectedState?.cities ?? [];
  }, [formData.state]);

  const liveLicenseStatus = useMemo(() => {
    if (!formData.licenseExpiryDate) return null;
    return getDriverLicenseStatus({
      licenseExpiryDate: formData.licenseExpiryDate,
    });
  }, [formData.licenseExpiryDate]);

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleStateChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      state: value,
      city: "",
    }));

    setErrors((prev) => {
      const next = { ...prev };
      delete next.state;
      delete next.city;
      return next;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setToast(null);

    const { isValid, errors: validationErrors } = validateDriver(formData);

    if (!isValid) {
      setErrors(validationErrors);
      const errorCount = Object.keys(validationErrors).length;
      setToast({
        id: Date.now(),
        variant: "warning",
        title: "Please check the form",
        message:
          errorCount === 1
            ? "Please correct the highlighted field."
            : `Please correct the ${errorCount} highlighted fields.`,
      });

      // Auto scroll to first error
      const firstErrorField = document.querySelector("[aria-invalid='true']");
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        const updated = updateDriver(driverId, formData);
        navigate("/drivers", {
          state: {
            toast: {
              variant: "success",
              title: "Driver Updated",
              message: `Driver ${updated.name} (${updated.driverCode}) was updated successfully.`,
            },
            highlightedDriverId: updated.id,
          },
        });
      } else {
        const created = saveDriver(formData);
        navigate("/drivers", {
          state: {
            toast: {
              variant: "success",
              title: "Driver Added",
              message: `Driver ${created.name} (${created.driverCode}) was registered successfully.`,
            },
            highlightedDriverId: created.id,
          },
        });
      }
    } catch (err) {
      console.error("Failed to save driver:", err);
      setToast({
        id: Date.now(),
        variant: "error",
        title: isEditMode ? "Unable to update driver" : "Unable to save driver",
        message: err.message || "An unexpected error occurred.",
      });
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/drivers");
  };

  return (
    <div className="space-y-6 pb-12">
      {toast && (
        <Toast
          id={toast.id}
          variant={toast.variant}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-5xl space-y-6"
      >
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isEditMode ? "Edit Driver" : "Add Driver"}
            </h1>
            <p className="text-sm text-muted">
              {isEditMode
                ? "Update driver credentials, license compliance dates, and employment information."
                : "Register a new driver record into the Driver Master."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Save Driver"}
            </Button>
          </div>
        </div>

        {/* 1. PERSONAL INFORMATION */}
        <Card>
          <CardHeader>
            <CardTitle>1. Personal Information</CardTitle>
            <CardDescription>
              Basic identity details and Driver Master identification code.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              <FormField
                label="Driver Code"
                description="Auto-generated unique code."
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    value={formData.driverCode}
                    readOnly
                    disabled
                    className="font-mono bg-muted/10 font-medium"
                  />
                )}
              </FormField>

              <FormField label="Prefix">
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={formData.prefix}
                    options={DRIVER_PREFIXES}
                    onChange={(e) => updateField("prefix", e.target.value)}
                  />
                )}
              </FormField>

              <FormField
                label="Driver Full Name"
                required
                error={errors.name}
                className="md:col-span-2"
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    placeholder="e.g. Rajesh Patil"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                )}
              </FormField>

              <FormField label="Date of Birth" error={errors.dateOfBirth}>
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
                  />
                )}
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* 2. DRIVING LICENSE INFORMATION */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>2. Driving License Information</CardTitle>
                <CardDescription>
                  License credentials required for legal compliance and trip
                  eligibility.
                </CardDescription>
              </div>

              {liveLicenseStatus && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">License Status:</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      liveLicenseStatus.value === "valid"
                        ? "bg-success/10 text-success border border-success/20"
                        : liveLicenseStatus.value === "expiring_soon"
                          ? "bg-warning/10 text-warning border border-warning/20"
                          : "bg-error/10 text-error border border-error/20"
                    }`}
                  >
                    {liveLicenseStatus.label}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {liveLicenseStatus && liveLicenseStatus.value === "expired" && (
              <div className="rounded-lg border border-error/30 bg-error/5 p-3 text-xs text-error flex items-center gap-2">
                <span>🚫</span>
                <span>
                  <strong>Warning:</strong> This license is expired (
                  {liveLicenseStatus.message}). The driver will be marked
                  ineligible for new trips.
                </span>
              </div>
            )}

            {liveLicenseStatus &&
              liveLicenseStatus.value === "expiring_soon" && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-warning flex items-center gap-2">
                  <span>⚠️</span>
                  <span>
                    <strong>Notice:</strong> This license expires soon (
                    {liveLicenseStatus.message}).
                  </span>
                </div>
              )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                label="Driving License Number"
                required
                error={errors.licenseNumber}
                description="e.g. MH1220100012345"
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    placeholder="MH1220100012345"
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      updateField("licenseNumber", e.target.value.toUpperCase())
                    }
                    className="font-mono uppercase"
                  />
                )}
              </FormField>

              <FormField
                label="License Type / Category"
                required
                error={errors.licenseType}
              >
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={formData.licenseType}
                    options={LICENSE_TYPES}
                    onChange={(e) => updateField("licenseType", e.target.value)}
                  />
                )}
              </FormField>

              <FormField
                label="Issuing Authority / RTO"
                error={errors.issuingAuthority}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    placeholder="e.g. RTO Pune (MH-12)"
                    value={formData.issuingAuthority}
                    onChange={(e) =>
                      updateField("issuingAuthority", e.target.value)
                    }
                  />
                )}
              </FormField>

              <FormField
                label="License Issue Date"
                error={errors.licenseIssueDate}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="date"
                    value={formData.licenseIssueDate}
                    onChange={(e) =>
                      updateField("licenseIssueDate", e.target.value)
                    }
                  />
                )}
              </FormField>

              <FormField
                label="License Expiry Date"
                required
                error={errors.licenseExpiryDate}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="date"
                    value={formData.licenseExpiryDate}
                    onChange={(e) =>
                      updateField("licenseExpiryDate", e.target.value)
                    }
                  />
                )}
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* 3. CONTACT INFORMATION */}
        <Card>
          <CardHeader>
            <CardTitle>3. Contact & Residential Information</CardTitle>
            <CardDescription>
              Primary communication channels and address.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                label="Mobile No. 1 (Primary)"
                required
                error={errors.mobile}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543210"
                    value={formData.mobile}
                    onChange={(e) =>
                      updateField("mobile", e.target.value.replace(/\D/g, ""))
                    }
                  />
                )}
              </FormField>

              <FormField
                label="Mobile No. 2 (Alternate)"
                error={errors.alternateMobile}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="9876543211"
                    value={formData.alternateMobile}
                    onChange={(e) =>
                      updateField(
                        "alternateMobile",
                        e.target.value.replace(/\D/g, ""),
                      )
                    }
                  />
                )}
              </FormField>

              <FormField label="Email Address" error={errors.email}>
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="email"
                    placeholder="driver@example.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                )}
              </FormField>
            </div>

            <FormField label="Residential Address" error={errors.address}>
              {(fieldProps) => (
                <Textarea
                  {...fieldProps}
                  rows={2}
                  placeholder="Enter complete residential address"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                />
              )}
            </FormField>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <FormField label="State" error={errors.state}>
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={formData.state}
                    options={states}
                    placeholder="Select State"
                    onChange={(e) => handleStateChange(e.target.value)}
                  />
                )}
              </FormField>

              <FormField label="City" error={errors.city}>
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={formData.city}
                    options={cityOptions}
                    placeholder={
                      formData.state ? "Select City" : "Select State First"
                    }
                    disabled={!formData.state}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                )}
              </FormField>

              <FormField label="PIN Code" error={errors.pinCode}>
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="411038"
                    value={formData.pinCode}
                    onChange={(e) =>
                      updateField("pinCode", e.target.value.replace(/\D/g, ""))
                    }
                  />
                )}
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* 4. EMPLOYMENT & CONTRACT INFORMATION */}
        <Card>
          <CardHeader>
            <CardTitle>4. Employment & Assignment Information</CardTitle>
            <CardDescription>
              Driver classification, rate preferences, and internal identifiers.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              <FormField label="Driver Type" required error={errors.driverType}>
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={formData.driverType}
                    options={DRIVER_TYPES}
                    onChange={(e) => updateField("driverType", e.target.value)}
                  />
                )}
              </FormField>

              <FormField label="Joining Date" error={errors.joiningDate}>
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => updateField("joiningDate", e.target.value)}
                  />
                )}
              </FormField>

              <FormField
                label="Employee / Reference ID"
                error={errors.employeeReferenceId}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    placeholder="e.g. EMP-012 or ATT-09"
                    value={formData.employeeReferenceId}
                    onChange={(e) =>
                      updateField("employeeReferenceId", e.target.value)
                    }
                  />
                )}
              </FormField>

              <FormField
                label="Daily Rate (₹)"
                error={errors.dailyRate}
                description="Standard daily allowance/wage"
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    min="0"
                    step="50"
                    placeholder="e.g. 850"
                    value={formData.dailyRate}
                    onChange={(e) => updateField("dailyRate", e.target.value)}
                  />
                )}
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* 5. STATUS & NOTES */}
        <Card>
          <CardHeader>
            <CardTitle>5. Status & Internal Notes</CardTitle>
            <CardDescription>
              Operational availability and driver remarks.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Driver Master Status
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  Inactive drivers will not be selectable for trip assignments
                  or scheduling.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-semibold ${
                    formData.isActive ? "text-success" : "text-muted"
                  }`}
                >
                  {formData.isActive ? "Active" : "Inactive"}
                </span>
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => updateField("isActive", e.target.checked)}
                />
              </div>
            </div>

            <FormField label="Internal Notes & Special Skills">
              {(fieldProps) => (
                <Textarea
                  {...fieldProps}
                  rows={3}
                  placeholder="e.g. Hill station experienced, English speaking, heavy vehicle badge..."
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                />
              )}
            </FormField>
          </CardContent>

          <CardFooter className="justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Save Driver"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
