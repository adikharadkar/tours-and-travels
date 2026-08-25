import { useState, useEffect } from "react";
import Modal, {
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  ModalClose,
} from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { states } from "../../constants/india";
import { updateCustomer } from "../../services/customerService";

const PAYMENT_TERMS_OPTIONS = [
  { label: "Immediate", value: "immediate" },
  { label: "Net 15 Days", value: "15_days" },
  { label: "Net 30 Days", value: "30_days" },
  { label: "Net 45 Days", value: "45_days" },
  { label: "Net 60 Days", value: "60_days" },
];

export default function CustomerEditInlineModal({
  open,
  onClose,
  customer,
  onCustomerUpdated,
}) {
  const [formData, setFormData] = useState({
    name: "",
    billingName: "",
    gstin: "",
    pan: "",
    vendorCode: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingPinCode: "",
    paymentTerms: "30_days",
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        billingName: customer.billingName || customer.name || "",
        gstin: customer.gstin || customer.gstNumber || "",
        pan: customer.pan || "",
        vendorCode: customer.vendorCode || customer.customerCode || "",
        billingAddress: customer.billingAddress || customer.address || "",
        billingCity: customer.billingCity || customer.city || "",
        billingState: customer.billingState || customer.state || "",
        billingPinCode:
          customer.billingPinCode ||
          customer.pinCode ||
          customer.billingPincode ||
          customer.postalCode ||
          "",
        paymentTerms: customer.paymentTerms || "30_days",
      });
      setError("");
    }
  }, [customer, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customer?.id) return;

    if (!formData.name.trim()) {
      setError("Customer name is required.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const updated = updateCustomer(customer.id, {
        name: formData.name.trim(),
        billingName: formData.billingName.trim(),
        gstin: formData.gstin.trim().toUpperCase(),
        gstNumber: formData.gstin.trim().toUpperCase(),
        pan: formData.pan.trim().toUpperCase(),
        vendorCode: formData.vendorCode.trim(),
        billingAddress: formData.billingAddress.trim(),
        address: formData.billingAddress.trim(),
        billingCity: formData.billingCity.trim(),
        city: formData.billingCity.trim(),
        billingState: formData.billingState.trim(),
        state: formData.billingState.trim(),
        billingPinCode: formData.billingPinCode.trim(),
        pinCode: formData.billingPinCode.trim(),
        postalCode: formData.billingPinCode.trim(),
        paymentTerms: formData.paymentTerms,
      });

      if (onCustomerUpdated) {
        onCustomerUpdated(updated);
      }
      onClose();
    } catch (err) {
      console.error("Failed to update customer:", err);
      setError(err.message || "Failed to update customer record.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStateChange = (stateCodeOrLabel) => {
    const matched = states.find(
      (s) => s.value === stateCodeOrLabel || s.label === stateCodeOrLabel,
    );
    setFormData((prev) => ({
      ...prev,
      billingState: matched ? matched.label : stateCodeOrLabel,
    }));
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-xl">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <div>
            <ModalTitle>Update Customer Billing Profile</ModalTitle>
            <ModalDescription>
              Correct critical billing parameters, GSTIN, and payment terms for{" "}
              {customer?.name || "Customer"}.
            </ModalDescription>
          </div>
          <ModalClose onClose={onClose} />
        </ModalHeader>

        <ModalContent className="space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Customer & Billing Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Customer Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Billing Name (on Invoices)
              </label>
              <Input
                type="text"
                value={formData.billingName}
                onChange={(e) =>
                  setFormData({ ...formData, billingName: e.target.value })
                }
                placeholder="Leave blank if same as name"
              />
            </div>
          </div>

          {/* GSTIN, PAN, Vendor Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                GSTIN (15 Digits)
              </label>
              <Input
                type="text"
                placeholder="27AAACA8902A1Z5"
                value={formData.gstin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gstin: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                PAN
              </label>
              <Input
                type="text"
                placeholder="AAACA8902A"
                value={formData.pan}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    pan: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Vendor Code
              </label>
              <Input
                type="text"
                placeholder="VEND-8821"
                value={formData.vendorCode}
                onChange={(e) =>
                  setFormData({ ...formData, vendorCode: e.target.value })
                }
              />
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Billing Street Address *
            </label>
            <Input
              type="text"
              placeholder="e.g. 123 Supply Chain Blvd, Suite 400"
              value={formData.billingAddress}
              onChange={(e) =>
                setFormData({ ...formData, billingAddress: e.target.value })
              }
              required
            />
          </div>

          {/* City, State, PIN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                City
              </label>
              <Input
                type="text"
                value={formData.billingCity}
                onChange={(e) =>
                  setFormData({ ...formData, billingCity: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                State
              </label>
              <Select
                value={formData.billingState}
                onChange={(e) => handleStateChange(e.target.value)}
                options={[
                  { label: "Select State", value: "" },
                  ...states.map((s) => ({ label: s.label, value: s.label })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Postal PIN Code
              </label>
              <Input
                type="text"
                value={formData.billingPinCode}
                onChange={(e) =>
                  setFormData({ ...formData, billingPinCode: e.target.value })
                }
              />
            </div>
          </div>

          {/* Payment Terms */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Default Payment Terms
            </label>
            <Select
              value={formData.paymentTerms}
              onChange={(e) =>
                setFormData({ ...formData, paymentTerms: e.target.value })
              }
              options={PAYMENT_TERMS_OPTIONS}
            />
          </div>
        </ModalContent>

        <ModalFooter className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save & Update Profile"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
