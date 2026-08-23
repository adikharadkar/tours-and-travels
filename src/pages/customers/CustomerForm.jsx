import { useMemo, useState, useEffect } from "react";
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
import Toast from "../../components/ui/Toast";

// Update this import to wherever your state/city data lives.
import { states } from "../../constants/india";
import { validateCustomer } from "../../utils/validation/customerValidation";
import {
  saveCustomer,
  updateCustomer,
  getCustomerById,
} from "../../services/customerService";

const PAYMENT_TERMS = [
  { label: "Immediate", value: "immediate" },
  { label: "15 Days", value: "15_days" },
  { label: "30 Days", value: "30_days" },
  { label: "45 Days", value: "45_days" },
  { label: "60 Days", value: "60_days" },
];

const BILLING_CYCLES = [
  { label: "Per Trip", value: "per_trip" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const OPENING_BALANCE_TYPES = [
  { label: "Debit", value: "debit" },
  { label: "Credit", value: "credit" },
];

const CUSTOMER_TYPES = [
  { label: "Company", value: "company" },
  { label: "Individual", value: "individual" },
];

const PREFIXES = [
  { label: "Mr.", value: "mr" },
  { label: "Mrs.", value: "mrs" },
  { label: "Ms.", value: "ms" },
  { label: "Dr.", value: "dr" },
];

const getToday = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const initialFormData = {
  customerCode: "Will be generated automatically",
  registrationDate: getToday(),

  prefix: "",
  name: "",
  customerType: "company",
  contactPerson: "",

  mobile1: "",
  mobile2: "",
  email: "",
  alternateEmail: "",

  address: "",
  city: "",
  state: "",
  stateCode: "",
  pinCode: "",

  gstNumber: "",
  pan: "",
  billingName: "",
  billingSameAsAddress: false,
  billingAddress: "",
  billingCity: "",
  billingState: "",
  billingStateCode: "",
  billingPinCode: "",

  openingBalance: "",
  openingBalanceType: "",
  creditLimit: "",
  paymentTerms: "",
  billingCycle: "",

  dateOfBirth: "",
  marriageDate: "",
  notes: "",

  isActive: true,
};

const initialErrors = {};

export default function CustomerForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState(initialErrors);
  const [toast, setToast] = useState(null);

  const { customerId } = useParams();
  const navigate = useNavigate();

  const isEditMode = Boolean(customerId);
  const isCompany = formData.customerType === "company";
  const isIndividual = formData.customerType === "individual";

  useEffect(() => {
    if (!customerId) {
      return;
    }

    const customer = getCustomerById(customerId);

    if (!customer) {
      navigate("/customers", {
        replace: true,
      });

      return;
    }

    setFormData({
      ...initialFormData,
      ...customer,
      openingBalance: customer.openingBalance ?? "",
      creditLimit: customer.creditLimit ?? "",
      billingSameAsAddress: customer.billingSameAsAddress ?? false,
    });

    setErrors({});
  }, [customerId, navigate]);

  const cityOptions = useMemo(() => {
    const selectedState = states.find(
      (state) => state.value === formData.state,
    );

    return selectedState?.cities ?? [];
  }, [formData.state]);

  const billingCityOptions = useMemo(() => {
    const selectedState = states.find(
      (state) => state.value === formData.billingState,
    );

    return selectedState?.cities ?? [];
  }, [formData.billingState]);

  const handleToastClose = () => {
    setToast(null);
  };

  const updateField = (field, value) => {
    setFormData((previous) => {
      const updated = {
        ...previous,
        [field]: value,
      };

      if (previous.billingSameAsAddress) {
        if (field === "address") {
          updated.billingAddress = value;
        }

        if (field === "city") {
          updated.billingCity = value;
        }

        if (field === "state") {
          updated.billingState = value;
        }

        if (field === "stateCode") {
          updated.billingStateCode = value;
        }

        if (field === "pinCode") {
          updated.billingPinCode = value;
        }
      }

      return updated;
    });

    setErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }

      const updated = { ...previous };
      delete updated[field];

      return updated;
    });
  };

  const handleCustomerTypeChange = (value) => {
    setFormData((previous) => ({
      ...previous,
      customerType: value,

      prefix: value === "company" ? "" : previous.prefix,

      contactPerson: value === "individual" ? "" : previous.contactPerson,

      dateOfBirth: value === "company" ? "" : previous.dateOfBirth,

      marriageDate: value === "company" ? "" : previous.marriageDate,
    }));

    setErrors({});
  };

  const handleStateChange = (value) => {
    const selectedState = states.find((state) => state.value === value);

    setFormData((previous) => {
      const updated = {
        ...previous,
        state: value,
        stateCode: selectedState?.stateCode ?? "",
        city: "",
      };

      if (previous.billingSameAsAddress) {
        updated.billingState = value;
        updated.billingStateCode = selectedState?.stateCode ?? "";
        updated.billingCity = "";
      }

      return updated;
    });

    setErrors((previous) => ({
      ...previous,
      state: undefined,
      city: undefined,
    }));
  };

  const handleBillingStateChange = (value) => {
    const selectedState = states.find((state) => state.value === value);

    setFormData((previous) => ({
      ...previous,
      billingState: value,
      billingStateCode: selectedState?.stateCode ?? "",
      billingCity: "",
    }));

    setErrors((previous) => ({
      ...previous,
      billingState: undefined,
      billingCity: undefined,
    }));
  };

  const handleBillingSameAsAddressChange = (checked) => {
    if (checked) {
      setFormData((previous) => ({
        ...previous,
        billingSameAsAddress: true,
        billingAddress: previous.address,
        billingCity: previous.city,
        billingState: previous.state,
        billingStateCode: previous.stateCode,
        billingPinCode: previous.pinCode,
      }));

      setErrors((previous) => {
        const updated = { ...previous };

        delete updated.billingAddress;
        delete updated.billingCity;
        delete updated.billingState;
        delete updated.billingStateCode;
        delete updated.billingPinCode;

        return updated;
      });

      return;
    }

    setFormData((previous) => ({
      ...previous,
      billingSameAsAddress: false,
    }));
  };

  const buildCustomerPayload = (formData) => ({
    registrationDate: formData.registrationDate,
    customerType: formData.customerType,
    prefix: formData.prefix,
    name: formData.name.trim(),
    contactPerson: formData.contactPerson.trim(),
    mobile1: formData.mobile1.trim(),
    mobile2: formData.mobile2.trim(),
    email: formData.email.trim().toLowerCase(),
    alternateEmail: formData.alternateEmail.trim().toLowerCase(),
    address: formData.address.trim(),
    city: formData.city,
    state: formData.state,
    stateCode: formData.stateCode,
    pinCode: formData.pinCode,
    gstNumber: formData.gstNumber.trim().toUpperCase(),
    pan: formData.pan.trim().toUpperCase(),
    billingName: formData.billingName.trim(),
    billingSameAsAddress: formData.billingSameAsAddress,
    billingAddress: formData.billingAddress.trim(),
    billingCity: formData.billingCity,
    billingState: formData.billingState,
    billingStateCode: formData.billingStateCode,
    billingPinCode: formData.billingPinCode,
    openingBalance: Number(formData.openingBalance),
    openingBalanceType: formData.openingBalanceType,
    creditLimit: formData.creditLimit === "" ? 0 : Number(formData.creditLimit),
    paymentTerms: formData.paymentTerms,
    billingCycle: formData.billingCycle,
    dateOfBirth: formData.dateOfBirth || null,
    marriageDate: formData.marriageDate || null,
    notes: formData.notes.trim(),
    isActive: formData.isActive,
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    setToast(null);

    const validationErrors = validateCustomer(formData);

    setErrors(validationErrors);

    const errorFields = Object.keys(validationErrors);

    if (errorFields.length > 0) {
      setToast({
        id: crypto.randomUUID(),
        title: "Please check the form",
        message:
          errorFields.length === 1
            ? "Please correct the highlighted field."
            : `Please correct the ${errorFields.length} highlighted fields.`,
        variant: "warning",
        duration: 5000,
      });

      return;
    }

    try {
      const payload = buildCustomerPayload(formData);

      if (isEditMode) {
        const updatedCustomer = updateCustomer(customerId, payload);

        navigate("/customers", {
          state: {
            toast: {
              variant: "success",
              title: "Customer Updated",
              message: `Customer ${updatedCustomer.name} (${updatedCustomer.customerCode}) was updated successfully.`,
            },
            highlightedCustomerId: updatedCustomer.id,
          },
        });

        return;
      }

      const newCustomer = saveCustomer(payload);

      navigate("/customers", {
        state: {
          toast: {
            variant: "success",
            title: "Customer Added",
            message: `Customer ${newCustomer.name} (${newCustomer.customerCode}) was created successfully.`,
          },
          highlightedCustomerId: newCustomer.id,
        },
      });
    } catch (error) {
      console.error("Failed to save customer:", error);

      setToast({
        id: crypto.randomUUID(),
        title: isEditMode
          ? "Unable to update customer"
          : "Unable to save customer",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        variant: "error",
        duration: 5000,
      });
    }
  };

  const handleCancel = () => {
    navigate("/customers");
  };

  return (
    <>
      {toast && (
        <div className="fixed right-6 top-6 z-50">
          <Toast
            id={toast.id}
            title={toast.title}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
            onClose={handleToastClose}
          />
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-6xl space-y-6"
      >
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isEditMode ? "Edit Customer" : "Add Customer"}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {isEditMode
                ? "Update customer information, billing details and account preferences."
                : "Add customer information, billing details and account preferences."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>

            <Button type="submit">
              {isEditMode ? "Save Changes" : "Save Customer"}
            </Button>
          </div>
        </div>

        {/* =====================================================
          CUSTOMER INFORMATION
      ====================================================== */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>

            <CardDescription>
              Basic identification and customer type details.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                label="Customer Code"
                description="Automatically generated."
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    value={formData.customerCode}
                    readOnly
                    disabled
                  />
                )}
              </FormField>

              <FormField
                label="Registration Date"
                required
                error={errors.registrationDate}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="date"
                    value={formData.registrationDate}
                    onChange={(event) =>
                      updateField("registrationDate", event.target.value)
                    }
                  />
                )}
              </FormField>

              <FormField
                label="Customer Type"
                required
                error={errors.customerType}
              >
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={formData.customerType}
                    onChange={(event) =>
                      handleCustomerTypeChange(event.target.value)
                    }
                    options={CUSTOMER_TYPES}
                  />
                )}
              </FormField>

              {isIndividual && (
                <FormField label="Prefix" required error={errors.prefix}>
                  {(fieldProps) => (
                    <Select
                      {...fieldProps}
                      value={formData.prefix}
                      onChange={(event) =>
                        updateField("prefix", event.target.value)
                      }
                      options={PREFIXES}
                      placeholder="Select prefix"
                    />
                  )}
                </FormField>
              )}

              <FormField
                label={isCompany ? "Company Name" : "Customer Name"}
                required
                error={errors.name}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    value={formData.name}
                    placeholder={
                      isCompany ? "e.g. Perkins India" : "Enter customer name"
                    }
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                  />
                )}
              </FormField>

              {isCompany && (
                <FormField
                  label="Contact Person"
                  required
                  error={errors.contactPerson}
                >
                  {(fieldProps) => (
                    <Input
                      {...fieldProps}
                      value={formData.contactPerson}
                      placeholder="Enter contact person"
                      onChange={(event) =>
                        updateField("contactPerson", event.target.value)
                      }
                    />
                  )}
                </FormField>
              )}
            </div>
          </CardContent>
        </Card>

        {/* =====================================================
          CONTACT INFORMATION
      ====================================================== */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>

            <CardDescription>
              Primary and alternate contact information.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label="Mobile No. 1" required error={errors.mobile1}>
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.mobile1}
                    placeholder="9876543210"
                    onChange={(event) =>
                      updateField(
                        "mobile1",
                        event.target.value.replace(/\D/g, ""),
                      )
                    }
                  />
                )}
              </FormField>

              <FormField label="Mobile No. 2" error={errors.mobile2}>
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.mobile2}
                    placeholder="9876543210"
                    onChange={(event) =>
                      updateField(
                        "mobile2",
                        event.target.value.replace(/\D/g, ""),
                      )
                    }
                  />
                )}
              </FormField>

              <FormField label="Email" required error={errors.email}>
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="email"
                    value={formData.email}
                    placeholder="customer@example.com"
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                  />
                )}
              </FormField>

              <FormField label="Alternate Email" error={errors.alternateEmail}>
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="email"
                    value={formData.alternateEmail}
                    placeholder="alternate@example.com"
                    onChange={(event) =>
                      updateField("alternateEmail", event.target.value)
                    }
                  />
                )}
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* =====================================================
          ADDRESS INFORMATION
      ====================================================== */}
        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>

            <CardDescription>
              Customer's registered and contact address.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-5">
              <FormField label="Address" required error={errors.address}>
                {(fieldProps) => (
                  <Textarea
                    {...fieldProps}
                    rows={3}
                    value={formData.address}
                    placeholder="Enter complete address"
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                  />
                )}
              </FormField>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                <FormField label="State" required error={errors.state}>
                  {(fieldProps) => (
                    <Select
                      {...fieldProps}
                      value={formData.state}
                      onChange={(event) =>
                        handleStateChange(event.target.value)
                      }
                      options={states}
                      placeholder="Select state"
                    />
                  )}
                </FormField>

                <FormField label="City" required error={errors.city}>
                  {(fieldProps) => (
                    <Select
                      {...fieldProps}
                      value={formData.city}
                      onChange={(event) =>
                        updateField("city", event.target.value)
                      }
                      options={cityOptions}
                      placeholder={
                        formData.state ? "Select city" : "Select state first"
                      }
                      disabled={!formData.state}
                    />
                  )}
                </FormField>

                <FormField label="State Code">
                  {(fieldProps) => (
                    <Input
                      {...fieldProps}
                      value={formData.stateCode}
                      readOnly
                      disabled
                    />
                  )}
                </FormField>

                <FormField label="PIN Code" required error={errors.pinCode}>
                  {(fieldProps) => (
                    <Input
                      {...fieldProps}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={formData.pinCode}
                      placeholder="431001"
                      onChange={(event) =>
                        updateField(
                          "pinCode",
                          event.target.value.replace(/\D/g, ""),
                        )
                      }
                    />
                  )}
                </FormField>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* =====================================================
          TAX & BILLING
      ====================================================== */}
        <Card>
          <CardHeader>
            <CardTitle>Tax & Billing Information</CardTitle>

            <CardDescription>
              GST, PAN and invoice billing information.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label="GST No." error={errors.gstNumber}>
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    value={formData.gstNumber}
                    placeholder="27ABCDE1234F1Z5"
                    maxLength={15}
                    onChange={(event) =>
                      updateField("gstNumber", event.target.value.toUpperCase())
                    }
                  />
                )}
              </FormField>

              <FormField label="PAN" error={errors.pan}>
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    value={formData.pan}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    onChange={(event) =>
                      updateField("pan", event.target.value.toUpperCase())
                    }
                  />
                )}
              </FormField>

              <FormField
                label="Billing Name"
                required
                error={errors.billingName}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    value={formData.billingName}
                    placeholder="Perkins India Pvt Ltd"
                    onChange={(event) =>
                      updateField("billingName", event.target.value)
                    }
                  />
                )}
              </FormField>

              <div className="md:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Billing Address
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Enter the address where invoices should be billed.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.billingSameAsAddress}
                      onChange={(event) =>
                        handleBillingSameAsAddressChange(event.target.checked)
                      }
                    />

                    <span className="text-sm text-foreground">
                      Same as customer address
                    </span>
                  </div>
                </div>

                <div className="space-y-5">
                  <FormField
                    label="Address"
                    required
                    error={errors.billingAddress}
                  >
                    {(fieldProps) => (
                      <Textarea
                        {...fieldProps}
                        rows={3}
                        value={formData.billingAddress}
                        placeholder="Enter billing address"
                        disabled={formData.billingSameAsAddress}
                        onChange={(event) =>
                          updateField("billingAddress", event.target.value)
                        }
                      />
                    )}
                  </FormField>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                    <FormField
                      label="State"
                      required
                      error={errors.billingState}
                    >
                      {(fieldProps) => (
                        <Select
                          {...fieldProps}
                          value={formData.billingState}
                          onChange={(event) =>
                            handleBillingStateChange(event.target.value)
                          }
                          options={states}
                          placeholder="Select state"
                          disabled={formData.billingSameAsAddress}
                        />
                      )}
                    </FormField>

                    <FormField label="City" required error={errors.billingCity}>
                      {(fieldProps) => (
                        <Select
                          {...fieldProps}
                          value={formData.billingCity}
                          onChange={(event) =>
                            updateField("billingCity", event.target.value)
                          }
                          options={billingCityOptions}
                          placeholder={
                            formData.billingState
                              ? "Select city"
                              : "Select state first"
                          }
                          disabled={
                            formData.billingSameAsAddress ||
                            !formData.billingState
                          }
                        />
                      )}
                    </FormField>

                    <FormField label="State Code">
                      {(fieldProps) => (
                        <Input
                          {...fieldProps}
                          value={formData.billingStateCode}
                          readOnly
                          disabled
                        />
                      )}
                    </FormField>

                    <FormField
                      label="PIN Code"
                      required
                      error={errors.billingPinCode}
                    >
                      {(fieldProps) => (
                        <Input
                          {...fieldProps}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={formData.billingPinCode}
                          placeholder="431001"
                          disabled={formData.billingSameAsAddress}
                          onChange={(event) =>
                            updateField(
                              "billingPinCode",
                              event.target.value.replace(/\D/g, ""),
                            )
                          }
                        />
                      )}
                    </FormField>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* =====================================================
          FINANCIAL / ACCOUNT INFORMATION
      ====================================================== */}
        <Card>
          <CardHeader>
            <CardTitle>Financial & Account Information</CardTitle>

            <CardDescription>
              Payment, credit and billing preferences.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                label="Opening Balance"
                required
                error={errors.openingBalance}
              >
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.openingBalance}
                    placeholder="0.00"
                    onChange={(event) =>
                      updateField("openingBalance", event.target.value)
                    }
                  />
                )}
              </FormField>

              <FormField label="Opening Balance Type">
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={formData.openingBalanceType}
                    onChange={(event) =>
                      updateField("openingBalanceType", event.target.value)
                    }
                    options={OPENING_BALANCE_TYPES}
                    placeholder="Select type"
                  />
                )}
              </FormField>

              <FormField label="Credit Limit">
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.creditLimit}
                    placeholder="0.00"
                    onChange={(event) =>
                      updateField("creditLimit", event.target.value)
                    }
                  />
                )}
              </FormField>

              <FormField
                label="Payment Terms"
                required
                error={errors.paymentTerms}
              >
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={formData.paymentTerms}
                    onChange={(event) =>
                      updateField("paymentTerms", event.target.value)
                    }
                    options={PAYMENT_TERMS}
                    placeholder="Select payment terms"
                  />
                )}
              </FormField>

              <FormField
                label="Billing Cycle"
                required
                error={errors.billingCycle}
              >
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={formData.billingCycle}
                    onChange={(event) =>
                      updateField("billingCycle", event.target.value)
                    }
                    options={BILLING_CYCLES}
                    placeholder="Select billing cycle"
                  />
                )}
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* =====================================================
          ADDITIONAL INFORMATION
      ====================================================== */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>

            <CardDescription>
              Optional personal information and internal notes.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {isIndividual && (
                <>
                  <FormField label="Date of Birth">
                    {(fieldProps) => (
                      <Input
                        {...fieldProps}
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(event) =>
                          updateField("dateOfBirth", event.target.value)
                        }
                      />
                    )}
                  </FormField>

                  <FormField label="Marriage Date">
                    {(fieldProps) => (
                      <Input
                        {...fieldProps}
                        type="date"
                        value={formData.marriageDate}
                        onChange={(event) =>
                          updateField("marriageDate", event.target.value)
                        }
                      />
                    )}
                  </FormField>
                </>
              )}

              <div className="md:col-span-2">
                <FormField label="Notes">
                  {(fieldProps) => (
                    <Textarea
                      {...fieldProps}
                      rows={4}
                      value={formData.notes}
                      placeholder="Add any additional notes..."
                      onChange={(event) =>
                        updateField("notes", event.target.value)
                      }
                    />
                  )}
                </FormField>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Customer Status
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Inactive customers won't be available for new transactions.
                  </p>
                </div>

                <Switch
                  checked={formData.isActive}
                  onChange={(event) =>
                    updateField("isActive", event.target.checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* =====================================================
          FOOTER ACTIONS
      ====================================================== */}
        <CardFooter className="justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>

          <Button type="submit">
            {isEditMode ? "Save Changes" : "Save Customer"}
          </Button>
        </CardFooter>
      </form>
    </>
  );
}
