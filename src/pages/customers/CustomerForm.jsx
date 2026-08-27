import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import Toast from "../../components/ui/Toast";
import { states } from "../../constants/india";
import { validateCustomer } from "../../utils/validation/customerValidation";
import {
  saveCustomer,
  updateCustomer,
  getCustomerById,
} from "../../services/customerService";
import {
  PAYMENT_TERMS,
  BILLING_CYCLES,
  OPENING_BALANCE_TYPES,
  PREFIXES,
  INITIAL_FORM_DATA,
} from "../../constants/customers";
import { buildCustomerPayload } from "../../utils/customers/helper";

export default function CustomerForm() {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      ...INITIAL_FORM_DATA,
      ...customer,
      vendorCode: customer.vendorCode || customer.customerVendorCode || "",
      openingBalance:
        customer.openingBalance !== undefined &&
        customer.openingBalance !== null
          ? String(customer.openingBalance)
          : "0.00",
      openingBalanceType: customer.openingBalanceType || "debit",
      creditLimit:
        customer.creditLimit !== undefined && customer.creditLimit !== null
          ? String(customer.creditLimit)
          : "",
      paymentTerms: customer.paymentTerms || "30_days",
      billingCycle: customer.billingCycle || "monthly",
      billingSameAsAddress: customer.billingSameAsAddress ?? false,
      isActive: customer.isActive !== false,
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

      // When billing address is synchronized with customer address
      if (previous.billingSameAsAddress) {
        if (field === "name" && !previous.billingName) {
          updated.billingName = value;
        }
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

    if (errors[field]) {
      setErrors((previous) => {
        const updated = { ...previous };
        delete updated[field];
        return updated;
      });
    }
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
    const sCode = selectedState?.stateCode ?? "";

    setFormData((previous) => {
      const updated = {
        ...previous,
        state: value,
        stateCode: sCode,
        city: "",
      };

      if (previous.billingSameAsAddress) {
        updated.billingState = value;
        updated.billingStateCode = sCode;
        updated.billingCity = "";
      }

      return updated;
    });

    setErrors((previous) => ({
      ...previous,
      state: undefined,
      city: undefined,
      stateCode: undefined,
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
      billingStateCode: undefined,
    }));
  };

  const handleBillingSameAsAddressChange = (checked) => {
    if (checked) {
      setFormData((previous) => ({
        ...previous,
        billingSameAsAddress: true,
        billingName: previous.billingName || previous.name,
        billingAddress: previous.address,
        billingCity: previous.city,
        billingState: previous.state,
        billingStateCode: previous.stateCode,
        billingPinCode: previous.pinCode,
      }));

      setErrors((previous) => {
        const updated = { ...previous };
        delete updated.billingName;
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

  const handleSubmit = (event) => {
    event.preventDefault();
    setToast(null);

    // Auto sync billing name if same as address is true
    const formToValidate = {
      ...formData,
      billingName: formData.billingSameAsAddress
        ? formData.billingName || formData.name
        : formData.billingName,
      billingAddress: formData.billingSameAsAddress
        ? formData.address
        : formData.billingAddress,
      billingCity: formData.billingSameAsAddress
        ? formData.city
        : formData.billingCity,
      billingState: formData.billingSameAsAddress
        ? formData.state
        : formData.billingState,
      billingStateCode: formData.billingSameAsAddress
        ? formData.stateCode
        : formData.billingStateCode,
      billingPinCode: formData.billingSameAsAddress
        ? formData.pinCode
        : formData.billingPinCode,
    };

    const validationErrors = validateCustomer(formToValidate);
    setErrors(validationErrors);

    const errorFields = Object.keys(validationErrors);

    if (errorFields.length > 0) {
      setToast({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        title: "Please check the form",
        message:
          errorFields.length === 1
            ? "Please correct the highlighted field."
            : `Please correct the ${errorFields.length} highlighted fields.`,
        variant: "warning",
        duration: 5000,
      });

      // Scroll to first invalid field smoothly
      const firstErrorKey = errorFields[0];
      const errorElement = document.querySelector(`[name="${firstErrorKey}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        errorElement.focus?.();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = buildCustomerPayload(formToValidate);

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
      setIsSubmitting(false);

      setToast({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
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
    <div className="min-h-full">
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

      {/* Breadcrumb path for enterprise context */}
      <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link
          to="/customers"
          className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          Customers
        </Link>
        <span className="material-symbols-outlined text-[14px]">
          chevron_right
        </span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {isEditMode ? "Edit Customer" : "Add Customer"}
        </span>
      </div>

      {/* Sticky Header with Actions */}
      <div className="sticky top-0 z-30 -mx-4 -mt-2 mb-6 px-4 py-3 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 bg-[#f8fafc]/95 dark:bg-[#0f1117]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {isEditMode ? "Edit Customer" : "Add Customer"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isEditMode
                ? "Update customer information, billing details and account preferences."
                : "Create a new customer record for transport operations."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#191b22] border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/20 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] active:opacity-90 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditMode ? "Save Changes" : "Save Customer"}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="max-w-5xl mx-auto w-full pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* =======================================================================
              SECTION 1: CUSTOMER IDENTITY
             ======================================================================= */}
          <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-[#262837] gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8b5cf6] dark:text-[#a078ff] text-[20px]">
                    badge
                  </span>
                  Customer Identity
                </h2>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Basic identification details
                </p>
              </div>

              {/* Company / Individual Selector */}
              <div className="bg-slate-100 dark:bg-[#0f1117] p-1 rounded-lg inline-flex items-center self-start sm:self-auto border border-slate-200/60 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleCustomerTypeChange("company")}
                  className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isCompany
                      ? "bg-white dark:bg-[#202330] text-[#6b38d4] dark:text-[#d0bcff] shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Company
                </button>
                <button
                  type="button"
                  onClick={() => handleCustomerTypeChange("individual")}
                  className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isIndividual
                      ? "bg-white dark:bg-[#202330] text-[#6b38d4] dark:text-[#d0bcff] shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Individual
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* If Individual: Prefix & Name */}
              {isIndividual ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Prefix <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="prefix"
                      value={formData.prefix}
                      onChange={(e) => updateField("prefix", e.target.value)}
                      className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                        errors.prefix
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    >
                      <option value="">Select prefix</option>
                      {PREFIXES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {errors.prefix && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.prefix}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Customer Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      placeholder="e.g. Vikram Sethi"
                      onChange={(e) => updateField("name", e.target.value)}
                      className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                        errors.name
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.name}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* If Company: Company Name & Contact Person */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      placeholder="e.g. Apex Global Logistics Ltd"
                      onChange={(e) => updateField("name", e.target.value)}
                      className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                        errors.name
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Contact Person <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      placeholder="Enter primary contact name"
                      onChange={(e) =>
                        updateField("contactPerson", e.target.value)
                      }
                      className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                        errors.contactPerson
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.contactPerson && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.contactPerson}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Registration Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Registration Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px] pointer-events-none">
                    calendar_month
                  </span>
                  <input
                    type="date"
                    name="registrationDate"
                    value={formData.registrationDate}
                    onChange={(e) =>
                      updateField("registrationDate", e.target.value)
                    }
                    className={`w-full h-10 pl-10 pr-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                      errors.registrationDate
                        ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                    }`}
                  />
                </div>
                {errors.registrationDate && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.registrationDate}
                  </p>
                )}
              </div>

              {/* Customer Code */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Customer Code
                </label>
                {isEditMode ? (
                  <div className="w-full h-10 bg-slate-100 dark:bg-[#0f1117]/80 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-medium text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>{formData.customerCode}</span>
                    <span className="material-symbols-outlined text-[18px] text-slate-400">
                      lock
                    </span>
                  </div>
                ) : (
                  <div className="w-full h-10 bg-slate-50 dark:bg-[#0f1117]/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Will be generated automatically</span>
                    <span className="material-symbols-outlined text-[18px] text-slate-400">
                      info
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* =======================================================================
              SECTION 2: CONTACT INFORMATION
             ======================================================================= */}
          <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="pb-4 mb-5 border-b border-slate-200 dark:border-[#262837]">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#06b6d4] dark:text-[#4cd7f6] text-[20px]">
                  phone_iphone
                </span>
                Contact Information
              </h2>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Primary and alternate contact channels
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Mobile 1 */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Mobile No. 1 <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px] pointer-events-none">
                    phone_iphone
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    name="mobile1"
                    value={formData.mobile1}
                    placeholder="9876543210"
                    onChange={(e) =>
                      updateField("mobile1", e.target.value.replace(/\D/g, ""))
                    }
                    className={`w-full h-10 pl-10 pr-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                      errors.mobile1
                        ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                    }`}
                  />
                </div>
                {errors.mobile1 && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.mobile1}
                  </p>
                )}
              </div>

              {/* Mobile 2 */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Mobile No. 2
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px] pointer-events-none">
                    phone_iphone
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    name="mobile2"
                    value={formData.mobile2}
                    placeholder="Optional alternate number"
                    onChange={(e) =>
                      updateField("mobile2", e.target.value.replace(/\D/g, ""))
                    }
                    className={`w-full h-10 pl-10 pr-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                      errors.mobile2
                        ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                    }`}
                  />
                </div>
                {errors.mobile2 && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.mobile2}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px] pointer-events-none">
                    mail
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    placeholder="contact@company.com"
                    onChange={(e) => updateField("email", e.target.value)}
                    className={`w-full h-10 pl-10 pr-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                      errors.email
                        ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Alternate Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Alternate Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px] pointer-events-none">
                    mail
                  </span>
                  <input
                    type="email"
                    name="alternateEmail"
                    value={formData.alternateEmail}
                    placeholder="billing@company.com"
                    onChange={(e) =>
                      updateField("alternateEmail", e.target.value)
                    }
                    className={`w-full h-10 pl-10 pr-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                      errors.alternateEmail
                        ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                    }`}
                  />
                </div>
                {errors.alternateEmail && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.alternateEmail}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* =======================================================================
              SECTION 3: ADDRESS INFORMATION
             ======================================================================= */}
          <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="pb-4 mb-5 border-b border-slate-200 dark:border-[#262837]">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b5cf6] dark:text-[#a078ff] text-[20px]">
                  location_on
                </span>
                Address Information
              </h2>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Customer's registered operating address
              </p>
            </div>

            <div className="space-y-5">
              {/* Full Address */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  name="address"
                  value={formData.address}
                  placeholder="Enter complete street address, building, floor..."
                  onChange={(e) => updateField("address", e.target.value)}
                  className={`w-full px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none ${
                    errors.address
                      ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                      : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                  }`}
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.address}
                  </p>
                )}
              </div>

              {/* State, City, State Code, PIN Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                      errors.state
                        ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                    }`}
                  >
                    <option value="">Select State</option>
                    {states.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">
                      {errors.state}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    disabled={!formData.state}
                    onChange={(e) => updateField("city", e.target.value)}
                    className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed ${
                      errors.city
                        ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                    }`}
                  >
                    <option value="">
                      {formData.state ? "Select City" : "Select state first"}
                    </option>
                    {cityOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  {errors.city && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">
                      {errors.city}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    State Code
                  </label>
                  <input
                    type="text"
                    name="stateCode"
                    value={formData.stateCode}
                    readOnly
                    placeholder="e.g. 27"
                    className="w-full h-10 px-3 py-2 text-sm bg-slate-100 dark:bg-[#0f1117]/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-mono cursor-not-allowed"
                  />
                  {errors.stateCode && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">
                      {errors.stateCode}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    name="pinCode"
                    value={formData.pinCode}
                    placeholder="6-digit PIN"
                    onChange={(e) =>
                      updateField("pinCode", e.target.value.replace(/\D/g, ""))
                    }
                    className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                      errors.pinCode
                        ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                    }`}
                  />
                  {errors.pinCode && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">
                      {errors.pinCode}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* =======================================================================
              SECTION 4: TAX & BILLING INFORMATION
             ======================================================================= */}
          <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-[#262837] gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#06b6d4] dark:text-[#4cd7f6] text-[20px]">
                    receipt_long
                  </span>
                  Tax &amp; Billing Information
                </h2>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  GST, PAN, vendor references, and invoice billing details
                </p>
              </div>

              {/* Same as Customer Address Switch */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.billingSameAsAddress}
                    onChange={(e) =>
                      handleBillingSameAsAddressChange(e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#8b5cf6]"></div>
                </div>
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                  Same as Customer Address
                </span>
              </label>
            </div>

            {/* GST & PAN & Vendor Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  GST No.
                </label>
                <input
                  type="text"
                  maxLength={15}
                  name="gstNumber"
                  value={formData.gstNumber}
                  placeholder="27ABCDE1234F1Z5"
                  onChange={(e) =>
                    updateField("gstNumber", e.target.value.toUpperCase())
                  }
                  className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all uppercase text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono ${
                    errors.gstNumber
                      ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                      : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                  }`}
                />
                {errors.gstNumber && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.gstNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  PAN
                </label>
                <input
                  type="text"
                  maxLength={10}
                  name="pan"
                  value={formData.pan}
                  placeholder="ABCDE1234F"
                  onChange={(e) =>
                    updateField("pan", e.target.value.toUpperCase())
                  }
                  className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all uppercase text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono ${
                    errors.pan
                      ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                      : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                  }`}
                />
                {errors.pan && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.pan}
                  </p>
                )}
              </div>

              {/* Customer Vendor Code / Reference */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Customer Vendor Code / Reference
                </label>
                <input
                  type="text"
                  name="vendorCode"
                  value={formData.vendorCode}
                  placeholder="Internal reference or vendor code provided by customer (e.g. VEN-98231)"
                  onChange={(e) => updateField("vendorCode", e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Separate Billing Address Sub-section */}
            <div className="pt-5 border-t border-slate-200 dark:border-[#262837]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Billing Address Details
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formData.billingSameAsAddress
                      ? "Automatically synchronized with registered address above."
                      : "Specify a custom address for invoicing and dispatch bills."}
                  </p>
                </div>
                {formData.billingSameAsAddress && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#8b5cf6]/10 text-[#8b5cf6] dark:text-[#d0bcff] border border-[#8b5cf6]/20">
                    <span className="material-symbols-outlined text-[14px]">
                      sync
                    </span>
                    Synchronized
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {/* Billing Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Billing Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="billingName"
                    value={
                      formData.billingSameAsAddress
                        ? formData.billingName || formData.name
                        : formData.billingName
                    }
                    placeholder="e.g. Apex Global Logistics Ltd"
                    disabled={formData.billingSameAsAddress}
                    onChange={(e) => updateField("billingName", e.target.value)}
                    className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-[#0f1117]/60 disabled:text-slate-600 dark:disabled:text-slate-400 disabled:cursor-not-allowed ${
                      errors.billingName
                        ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                    }`}
                  />
                  {errors.billingName && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">
                      {errors.billingName}
                    </p>
                  )}
                </div>

                {/* Billing Street Address */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Billing Full Address{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    name="billingAddress"
                    value={
                      formData.billingSameAsAddress
                        ? formData.address
                        : formData.billingAddress
                    }
                    placeholder="Enter complete billing address..."
                    disabled={formData.billingSameAsAddress}
                    onChange={(e) =>
                      updateField("billingAddress", e.target.value)
                    }
                    className={`w-full px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 resize-none disabled:bg-slate-100 dark:disabled:bg-[#0f1117]/60 disabled:text-slate-600 dark:disabled:text-slate-400 disabled:cursor-not-allowed ${
                      errors.billingAddress
                        ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                    }`}
                  />
                  {errors.billingAddress && (
                    <p className="mt-1 text-xs text-rose-500 font-medium">
                      {errors.billingAddress}
                    </p>
                  )}
                </div>

                {/* Billing State, City, State Code, PIN Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Billing State <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="billingState"
                      value={
                        formData.billingSameAsAddress
                          ? formData.state
                          : formData.billingState
                      }
                      disabled={formData.billingSameAsAddress}
                      onChange={(e) => handleBillingStateChange(e.target.value)}
                      className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-[#0f1117]/60 disabled:text-slate-600 dark:disabled:text-slate-400 disabled:cursor-not-allowed ${
                        errors.billingState
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    >
                      <option value="">Select state</option>
                      {states.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {errors.billingState && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.billingState}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Billing City <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="billingCity"
                      value={
                        formData.billingSameAsAddress
                          ? formData.city
                          : formData.billingCity
                      }
                      disabled={
                        formData.billingSameAsAddress || !formData.billingState
                      }
                      onChange={(e) =>
                        updateField("billingCity", e.target.value)
                      }
                      className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-[#0f1117]/60 disabled:text-slate-600 dark:disabled:text-slate-400 disabled:cursor-not-allowed ${
                        errors.billingCity
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    >
                      <option value="">
                        {formData.billingState || formData.state
                          ? "Select city"
                          : "Select state first"}
                      </option>
                      {billingCityOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {errors.billingCity && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.billingCity}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Billing State Code
                    </label>
                    <input
                      type="text"
                      name="billingStateCode"
                      value={
                        formData.billingSameAsAddress
                          ? formData.stateCode
                          : formData.billingStateCode
                      }
                      readOnly
                      placeholder="e.g. 27"
                      className="w-full h-10 px-3 py-2 text-sm bg-slate-100 dark:bg-[#0f1117]/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-mono cursor-not-allowed"
                    />
                    {errors.billingStateCode && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.billingStateCode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Billing PIN <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      name="billingPinCode"
                      value={
                        formData.billingSameAsAddress
                          ? formData.pinCode
                          : formData.billingPinCode
                      }
                      placeholder="6-digit PIN"
                      disabled={formData.billingSameAsAddress}
                      onChange={(e) =>
                        updateField(
                          "billingPinCode",
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                      className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-[#0f1117]/60 disabled:text-slate-600 dark:disabled:text-slate-400 disabled:cursor-not-allowed ${
                        errors.billingPinCode
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.billingPinCode && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.billingPinCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* =======================================================================
              SECTION 5: FINANCIAL & ACCOUNT PREFERENCES
             ======================================================================= */}
          <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="pb-4 mb-5 border-b border-slate-200 dark:border-[#262837]">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8b5cf6] dark:text-[#a078ff] text-[20px]">
                  payments
                </span>
                Financial &amp; Account Preferences
              </h2>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Credit limits, payment terms, and opening balances
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {/* Opening Balance */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Opening Balance <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-semibold text-sm pointer-events-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="openingBalance"
                    value={formData.openingBalance}
                    placeholder="0.00"
                    onChange={(e) =>
                      updateField("openingBalance", e.target.value)
                    }
                    className={`w-full h-10 pl-8 pr-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                      errors.openingBalance
                        ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                    }`}
                  />
                </div>
                {errors.openingBalance && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.openingBalance}
                  </p>
                )}
              </div>

              {/* Opening Balance Type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Balance Type
                </label>
                <select
                  name="openingBalanceType"
                  value={formData.openingBalanceType}
                  onChange={(e) =>
                    updateField("openingBalanceType", e.target.value)
                  }
                  className="w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-slate-900 dark:text-slate-100"
                >
                  {OPENING_BALANCE_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {errors.openingBalanceType && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.openingBalanceType}
                  </p>
                )}
              </div>

              {/* Credit Limit */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Credit Limit
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-semibold text-sm pointer-events-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="creditLimit"
                    value={formData.creditLimit}
                    placeholder="Enter limit"
                    onChange={(e) => updateField("creditLimit", e.target.value)}
                    className={`w-full h-10 pl-8 pr-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                      errors.creditLimit
                        ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                    }`}
                  />
                </div>
                {errors.creditLimit && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.creditLimit}
                  </p>
                )}
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Terms <span className="text-rose-500">*</span>
                </label>
                <select
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={(e) => updateField("paymentTerms", e.target.value)}
                  className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                    errors.paymentTerms
                      ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                      : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                  }`}
                >
                  <option value="">Select terms</option>
                  {PAYMENT_TERMS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {errors.paymentTerms && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.paymentTerms}
                  </p>
                )}
              </div>

              {/* Billing Cycle */}
              <div className="sm:col-span-2 md:col-span-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Billing Cycle <span className="text-rose-500">*</span>
                </label>
                <select
                  name="billingCycle"
                  value={formData.billingCycle}
                  onChange={(e) => updateField("billingCycle", e.target.value)}
                  className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                    errors.billingCycle
                      ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                      : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                  }`}
                >
                  <option value="">Select cycle</option>
                  {BILLING_CYCLES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {errors.billingCycle && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {errors.billingCycle}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* =======================================================================
              SECTION 6: ADDITIONAL INFORMATION
             ======================================================================= */}
          <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="pb-4 mb-5 border-b border-slate-200 dark:border-[#262837]">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#06b6d4] dark:text-[#4cd7f6] text-[20px]">
                  notes
                </span>
                Additional Information
              </h2>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Internal notes, personal details, and status controls
              </p>
            </div>

            <div className="space-y-5">
              {/* If Individual: Date of Birth & Marriage Date */}
              {isIndividual && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4 rounded-lg bg-slate-50 dark:bg-[#0f1117]/60 border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px] pointer-events-none">
                        calendar_month
                      </span>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                          updateField("dateOfBirth", e.target.value)
                        }
                        className={`w-full h-10 pl-10 pr-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                          errors.dateOfBirth
                            ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                            : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                        }`}
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Marriage Date
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px] pointer-events-none">
                        calendar_month
                      </span>
                      <input
                        type="date"
                        name="marriageDate"
                        value={formData.marriageDate}
                        onChange={(e) =>
                          updateField("marriageDate", e.target.value)
                        }
                        className={`w-full h-10 pl-10 pr-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                          errors.marriageDate
                            ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                            : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                        }`}
                      />
                    </div>
                    {errors.marriageDate && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.marriageDate}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Internal Notes
                </label>
                <textarea
                  rows={4}
                  name="notes"
                  value={formData.notes}
                  placeholder="Add any special instructions, preferred routes, or corporate guidelines for this customer..."
                  onChange={(e) => updateField("notes", e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                />
              </div>

              {/* Customer Status Switch Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#0f1117]/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Customer Status
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Inactive customers will not be available for new dispatch
                    bookings or invoicing.
                  </p>
                </div>

                <label className="flex items-center gap-3 cursor-pointer self-start sm:self-auto select-none">
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        updateField("isActive", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8b5cf6]"></div>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      formData.isActive
                        ? "text-[#6b38d4] dark:text-[#d0bcff]"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {formData.isActive ? "Active" : "Inactive"}
                  </span>
                </label>
              </div>
            </div>
          </section>

          {/* Bottom Action Area */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#262837]">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#191b22] border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] active:opacity-90 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditMode ? "Save Changes" : "Save Customer"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
