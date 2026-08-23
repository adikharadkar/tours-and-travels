import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
import FormField from "../../components/ui/FormField";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import Switch from "../../components/ui/Switch";
import DatePicker from "../../components/ui/DatePicker";
import Toast from "../../components/ui/Toast";

import {
  VEHICLE_TYPES,
  FUEL_TYPES,
  OWNERSHIP_TYPES,
} from "../../constants/vehicles";
import {
  validateVehicle,
  normalizeVehicleNumber,
} from "../../utils/validation/vehicleValidation";
import {
  saveVehicle,
  updateVehicle,
  getVehicleById,
} from "../../services/vehicleService";

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const initialFormData = {
  vehicleCode: "Will be generated automatically",
  vehicleNumber: "",
  vehicleType: "bus",
  registrationDate: getToday(),
  make: "",
  model: "",
  manufacturingYear: String(new Date().getFullYear()),
  seatingCapacity: "",
  fuelType: "diesel",

  ownershipType: "own",
  ownerName: "",
  ownerContact: "",

  insuranceNumber: "",
  insuranceExpiry: "",
  fitnessCertificateNumber: "",
  fitnessExpiry: "",
  permitNumber: "",
  permitExpiry: "",
  pucNumber: "",
  pucExpiry: "",

  notes: "",
  isActive: true,
};

export default function VehicleForm() {
  const navigate = useNavigate();
  const { vehicleId } = useParams();
  const isEditMode = Boolean(vehicleId);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  useEffect(() => {
    if (!isEditMode) {
      setFormData(initialFormData);
      setIsLoading(false);
      return;
    }

    try {
      const existingVehicle = getVehicleById(vehicleId);

      if (!existingVehicle) {
        setToast({
          id: Date.now(),
          variant: "error",
          title: "Vehicle Not Found",
          message: "The requested vehicle record could not be found.",
        });
        setTimeout(() => navigate("/vehicles"), 1500);
        return;
      }

      setFormData({
        vehicleCode: existingVehicle.vehicleCode || "",
        vehicleNumber: existingVehicle.vehicleNumber || "",
        vehicleType: existingVehicle.vehicleType || "bus",
        registrationDate: existingVehicle.registrationDate || getToday(),
        make: existingVehicle.make || "",
        model: existingVehicle.model || "",
        manufacturingYear: String(existingVehicle.manufacturingYear || ""),
        seatingCapacity: String(existingVehicle.seatingCapacity || ""),
        fuelType: existingVehicle.fuelType || "diesel",

        ownershipType: existingVehicle.ownershipType || "own",
        ownerName: existingVehicle.ownerName || "",
        ownerContact: existingVehicle.ownerContact || "",

        insuranceNumber: existingVehicle.insuranceNumber || "",
        insuranceExpiry: existingVehicle.insuranceExpiry || "",
        fitnessCertificateNumber:
          existingVehicle.fitnessCertificateNumber || "",
        fitnessExpiry: existingVehicle.fitnessExpiry || "",
        permitNumber: existingVehicle.permitNumber || "",
        permitExpiry: existingVehicle.permitExpiry || "",
        pucNumber: existingVehicle.pucNumber || "",
        pucExpiry: existingVehicle.pucExpiry || "",

        notes: existingVehicle.notes || "",
        isActive: existingVehicle.isActive !== false,
      });
    } catch (err) {
      console.error("Error loading vehicle:", err);
      setToast({
        id: Date.now(),
        variant: "error",
        title: "Error",
        message: "Failed to load vehicle data.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId, isEditMode, navigate]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      // Reset owner details if switched to 'own'
      if (field === "ownershipType" && value === "own") {
        next.ownerName = "";
        next.ownerContact = "";
      }

      // Auto-uppercase vehicle registration number
      if (field === "vehicleNumber") {
        next.vehicleNumber = String(value).toUpperCase();
      }

      return next;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBlur = (field) => {
    const result = validateVehicle(formData);
    if (result.errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: result.errors[field] }));
    }
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    setIsSubmitting(true);

    const validation = validateVehicle(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      setToast({
        id: Date.now(),
        variant: "warning",
        title: "Validation Error",
        message: "Please correct the highlighted fields before saving.",
      });
      setIsSubmitting(false);

      // Scroll to the first error
      const firstErrorField = Object.keys(validation.errors)[0];
      const el = document.getElementById(firstErrorField);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }
      return;
    }

    try {
      const payload = {
        ...formData,
        vehicleNumber: normalizeVehicleNumber(formData.vehicleNumber),
        manufacturingYear: Number(formData.manufacturingYear),
        seatingCapacity: Number(formData.seatingCapacity),
      };

      if (isEditMode) {
        const updated = updateVehicle(vehicleId, payload);
        navigate("/vehicles", {
          state: {
            toast: {
              variant: "success",
              title: "Vehicle Updated",
              message: `Vehicle ${updated.vehicleNumber} (${updated.vehicleCode}) was updated successfully.`,
            },
            highlightedVehicleId: updated.id,
          },
        });
      } else {
        const saved = saveVehicle(payload);
        navigate("/vehicles", {
          state: {
            toast: {
              variant: "success",
              title: "Vehicle Added",
              message: `Vehicle ${saved.vehicleNumber} (${saved.vehicleCode}) was created successfully.`,
            },
            highlightedVehicleId: saved.id,
          },
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      setToast({
        id: Date.now(),
        variant: "error",
        title: "Save Failed",
        message:
          err.message ||
          "An unexpected error occurred while saving the vehicle.",
      });
      setIsSubmitting(false);
    }
  };

  const isAttachedOrLeased =
    formData.ownershipType === "attached" ||
    formData.ownershipType === "leased";

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted">Loading vehicle data...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {toast && (
        <Toast
          id={toast.id}
          variant={toast.variant}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isEditMode ? "Edit Vehicle" : "Add New Vehicle"}
          </h1>
          <p className="text-sm text-muted">
            {isEditMode
              ? `Editing vehicle ${formData.vehicleCode}`
              : "Register a new vehicle in the fleet management master."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/vehicles")}
            disabled={isSubmitting}
          >
            Back to Vehicles
          </Button>

          <Button
            type="submit"
            form="vehicle-form"
            variant="primary"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting
              ? "Saving..."
              : isEditMode
                ? "Save Changes"
                : "Save Vehicle"}
          </Button>
        </div>
      </div>

      <form
        id="vehicle-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6"
      >
        {/* SECTION 1: Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle>1. Vehicle Information</CardTitle>
            <CardDescription>
              Basic identification, make, model, and physical specifications.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <FormField
              label="Vehicle Code"
              description="Generated automatically"
            >
              {({ id }) => (
                <Input
                  id={id}
                  value={formData.vehicleCode}
                  disabled
                  className="bg-muted/10 font-mono text-muted cursor-not-allowed"
                />
              )}
            </FormField>

            <FormField
              label="Vehicle Registration Number"
              required
              error={errors.vehicleNumber}
              description="e.g. MH20AB1234"
            >
              {({
                id,
                "aria-describedby": describedBy,
                "aria-invalid": invalid,
              }) => (
                <Input
                  id={id}
                  placeholder="MH20AB1234"
                  value={formData.vehicleNumber}
                  onChange={(e) =>
                    handleChange("vehicleNumber", e.target.value)
                  }
                  onBlur={() => handleBlur("vehicleNumber")}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className="font-mono uppercase font-semibold"
                />
              )}
            </FormField>

            <FormField label="Vehicle Type" required error={errors.vehicleType}>
              {({
                id,
                "aria-describedby": describedBy,
                "aria-invalid": invalid,
              }) => (
                <Select
                  id={id}
                  value={formData.vehicleType}
                  options={VEHICLE_TYPES}
                  onChange={(e) => handleChange("vehicleType", e.target.value)}
                  onBlur={() => handleBlur("vehicleType")}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                />
              )}
            </FormField>

            <FormField
              label="Registration Date"
              required
              error={errors.registrationDate}
            >
              {({
                id,
                "aria-describedby": describedBy,
                "aria-invalid": invalid,
              }) => (
                <DatePicker
                  id={id}
                  value={formData.registrationDate}
                  onChange={(e) =>
                    handleChange("registrationDate", e.target.value)
                  }
                  onBlur={() => handleBlur("registrationDate")}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                />
              )}
            </FormField>

            <FormField label="Make / Manufacturer" required error={errors.make}>
              {({
                id,
                "aria-describedby": describedBy,
                "aria-invalid": invalid,
              }) => (
                <Input
                  id={id}
                  placeholder="e.g. Tata, Ashok Leyland"
                  value={formData.make}
                  onChange={(e) => handleChange("make", e.target.value)}
                  onBlur={() => handleBlur("make")}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                />
              )}
            </FormField>

            <FormField label="Model" required error={errors.model}>
              {({
                id,
                "aria-describedby": describedBy,
                "aria-invalid": invalid,
              }) => (
                <Input
                  id={id}
                  placeholder="e.g. Starbus, Innova Crysta"
                  value={formData.model}
                  onChange={(e) => handleChange("model", e.target.value)}
                  onBlur={() => handleBlur("model")}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                />
              )}
            </FormField>

            <FormField
              label="Manufacturing Year"
              required
              error={errors.manufacturingYear}
            >
              {({
                id,
                "aria-describedby": describedBy,
                "aria-invalid": invalid,
              }) => (
                <Input
                  id={id}
                  type="number"
                  placeholder="YYYY"
                  min="1970"
                  max={new Date().getFullYear() + 1}
                  value={formData.manufacturingYear}
                  onChange={(e) =>
                    handleChange("manufacturingYear", e.target.value)
                  }
                  onBlur={() => handleBlur("manufacturingYear")}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                />
              )}
            </FormField>

            <FormField
              label="Seating Capacity"
              required
              error={errors.seatingCapacity}
            >
              {({
                id,
                "aria-describedby": describedBy,
                "aria-invalid": invalid,
              }) => (
                <Input
                  id={id}
                  type="number"
                  placeholder="e.g. 45"
                  min="1"
                  max="150"
                  value={formData.seatingCapacity}
                  onChange={(e) =>
                    handleChange("seatingCapacity", e.target.value)
                  }
                  onBlur={() => handleBlur("seatingCapacity")}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                />
              )}
            </FormField>

            <FormField label="Fuel Type" required error={errors.fuelType}>
              {({
                id,
                "aria-describedby": describedBy,
                "aria-invalid": invalid,
              }) => (
                <Select
                  id={id}
                  value={formData.fuelType}
                  options={FUEL_TYPES}
                  onChange={(e) => handleChange("fuelType", e.target.value)}
                  onBlur={() => handleBlur("fuelType")}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                />
              )}
            </FormField>
          </CardContent>
        </Card>

        {/* SECTION 2: Ownership Information */}
        <Card>
          <CardHeader>
            <CardTitle>2. Ownership Information</CardTitle>
            <CardDescription>
              Specify whether the vehicle is company-owned, attached, or leased.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                label="Ownership Type"
                required
                error={errors.ownershipType}
              >
                {({
                  id,
                  "aria-describedby": describedBy,
                  "aria-invalid": invalid,
                }) => (
                  <Select
                    id={id}
                    value={formData.ownershipType}
                    options={OWNERSHIP_TYPES}
                    onChange={(e) =>
                      handleChange("ownershipType", e.target.value)
                    }
                    onBlur={() => handleBlur("ownershipType")}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                  />
                )}
              </FormField>

              {isAttachedOrLeased && (
                <>
                  <FormField
                    label="Owner Name"
                    required
                    error={errors.ownerName}
                  >
                    {({
                      id,
                      "aria-describedby": describedBy,
                      "aria-invalid": invalid,
                    }) => (
                      <Input
                        id={id}
                        placeholder="Owner / Vendor Name"
                        value={formData.ownerName}
                        onChange={(e) =>
                          handleChange("ownerName", e.target.value)
                        }
                        onBlur={() => handleBlur("ownerName")}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                      />
                    )}
                  </FormField>

                  <FormField
                    label="Owner Contact Number"
                    required
                    error={errors.ownerContact}
                  >
                    {({
                      id,
                      "aria-describedby": describedBy,
                      "aria-invalid": invalid,
                    }) => (
                      <Input
                        id={id}
                        placeholder="10-digit mobile number"
                        value={formData.ownerContact}
                        onChange={(e) =>
                          handleChange("ownerContact", e.target.value)
                        }
                        onBlur={() => handleBlur("ownerContact")}
                        aria-describedby={describedBy}
                        aria-invalid={invalid}
                      />
                    )}
                  </FormField>
                </>
              )}
            </div>

            {!isAttachedOrLeased && (
              <p className="text-xs text-muted">
                Company-owned vehicle. No third-party owner details required.
              </p>
            )}
          </CardContent>
        </Card>

        {/* SECTION 3: Documents & Compliance Information */}
        <Card>
          <CardHeader>
            <CardTitle>3. Compliance & Document Information</CardTitle>
            <CardDescription>
              Track document numbers and expiry dates to monitor fleet
              compliance.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Insurance */}
            <div className="rounded-lg border border-border p-3.5 space-y-3 bg-surface/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Insurance Policy
              </h4>
              <FormField label="Insurance Policy Number">
                {({ id }) => (
                  <Input
                    id={id}
                    placeholder="e.g. POL-12345678"
                    value={formData.insuranceNumber}
                    onChange={(e) =>
                      handleChange("insuranceNumber", e.target.value)
                    }
                  />
                )}
              </FormField>
              <FormField
                label="Insurance Expiry Date"
                required
                error={errors.insuranceExpiry}
              >
                {({
                  id,
                  "aria-describedby": describedBy,
                  "aria-invalid": invalid,
                }) => (
                  <DatePicker
                    id={id}
                    value={formData.insuranceExpiry}
                    onChange={(e) =>
                      handleChange("insuranceExpiry", e.target.value)
                    }
                    onBlur={() => handleBlur("insuranceExpiry")}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                  />
                )}
              </FormField>
            </div>

            {/* Fitness */}
            <div className="rounded-lg border border-border p-3.5 space-y-3 bg-surface/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Fitness Certificate
              </h4>
              <FormField label="Fitness Certificate No.">
                {({ id }) => (
                  <Input
                    id={id}
                    placeholder="e.g. FC-987654"
                    value={formData.fitnessCertificateNumber}
                    onChange={(e) =>
                      handleChange("fitnessCertificateNumber", e.target.value)
                    }
                  />
                )}
              </FormField>
              <FormField
                label="Fitness Expiry Date"
                required
                error={errors.fitnessExpiry}
              >
                {({
                  id,
                  "aria-describedby": describedBy,
                  "aria-invalid": invalid,
                }) => (
                  <DatePicker
                    id={id}
                    value={formData.fitnessExpiry}
                    onChange={(e) =>
                      handleChange("fitnessExpiry", e.target.value)
                    }
                    onBlur={() => handleBlur("fitnessExpiry")}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                  />
                )}
              </FormField>
            </div>

            {/* PUC */}
            <div className="rounded-lg border border-border p-3.5 space-y-3 bg-surface/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Pollution Under Control (PUC)
              </h4>
              <FormField label="PUC Number">
                {({ id }) => (
                  <Input
                    id={id}
                    placeholder="e.g. PUC-2024-889"
                    value={formData.pucNumber}
                    onChange={(e) => handleChange("pucNumber", e.target.value)}
                  />
                )}
              </FormField>
              <FormField
                label="PUC Expiry Date"
                required
                error={errors.pucExpiry}
              >
                {({
                  id,
                  "aria-describedby": describedBy,
                  "aria-invalid": invalid,
                }) => (
                  <DatePicker
                    id={id}
                    value={formData.pucExpiry}
                    onChange={(e) => handleChange("pucExpiry", e.target.value)}
                    onBlur={() => handleBlur("pucExpiry")}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                  />
                )}
              </FormField>
            </div>

            {/* Permit */}
            <div className="rounded-lg border border-border p-3.5 space-y-3 bg-surface/50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                Transport Permit (Optional)
              </h4>
              <FormField label="Permit Number">
                {({ id }) => (
                  <Input
                    id={id}
                    placeholder="e.g. ALL-INDIA-PERMIT-44"
                    value={formData.permitNumber}
                    onChange={(e) =>
                      handleChange("permitNumber", e.target.value)
                    }
                  />
                )}
              </FormField>
              <FormField label="Permit Expiry Date" error={errors.permitExpiry}>
                {({
                  id,
                  "aria-describedby": describedBy,
                  "aria-invalid": invalid,
                }) => (
                  <DatePicker
                    id={id}
                    value={formData.permitExpiry}
                    onChange={(e) =>
                      handleChange("permitExpiry", e.target.value)
                    }
                    onBlur={() => handleBlur("permitExpiry")}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                  />
                )}
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: Operational Status & Notes */}
        <Card>
          <CardHeader>
            <CardTitle>4. Status & Notes</CardTitle>
            <CardDescription>
              Operational availability toggle and internal management notes.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3.5">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Vehicle Active Status
                </p>
                <p className="text-xs text-muted">
                  Inactive vehicles cannot be assigned to new trips or bookings.
                </p>
              </div>

              <Switch
                checked={formData.isActive}
                onChange={(checked) => handleChange("isActive", checked)}
              />
            </div>

            <FormField label="Notes / Additional Information">
              {({ id }) => (
                <Textarea
                  id={id}
                  rows={3}
                  placeholder="Add any specific vehicle history, maintenance remarks, or special equipment notes..."
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                />
              )}
            </FormField>
          </CardContent>

          <CardFooter className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/vehicles")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Save Changes"
                  : "Save Vehicle"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
