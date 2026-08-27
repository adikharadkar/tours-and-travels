import { forwardRef, useMemo } from "react";
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
import formatValue from "../../utils/formatValue";
import {
  getCustomerInitials,
  formatCustomerType,
  formatPaymentTerms,
  formatBillingCycle,
  formatOpeningBalanceType,
  formatDate,
  formatCurrency,
} from "../../utils/customers/helper";

function DetailItem({ label, value, subtext, className = "", children }) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="mt-1 break-words text-sm text-foreground">
        {children || formatValue(value)}
      </div>
      {subtext && (
        <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-400">
          {subtext}
        </p>
      )}
    </div>
  );
}

function DetailSection({
  title,
  icon,
  badge,
  children,
  className = "",
  columnsClass = "sm:grid-cols-2",
}) {
  return (
    <section
      className={[
        "rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] p-4 sm:p-5 shadow-2xs",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#202330] pb-3 mb-4">
        <div className="flex items-center gap-2">
          {icon && (
            <span className="material-symbols-outlined text-[18px] text-cyan-600 dark:text-cyan-400 select-none">
              {icon}
            </span>
          )}
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {title}
          </h3>
        </div>
        {badge}
      </div>

      <div
        className={["grid grid-cols-1 gap-x-6 gap-y-4", columnsClass].join(" ")}
      >
        {children}
      </div>
    </section>
  );
}

const CustomerDetailsModal = forwardRef(function CustomerDetailsModal(
  { open, customer, onClose, onEdit, onCreateTrip },
  ref,
) {
  const isSameBillingAddress = useMemo(() => {
    if (!customer) return false;
    if (customer.sameAsRegistered) return true;
    if (!customer.billingAddress && !customer.billingCity) return true;
    return (
      (customer.billingAddress || "").trim() ===
        (customer.address || "").trim() &&
      (customer.billingCity || "").trim() === (customer.city || "").trim() &&
      (customer.billingState || "").trim() === (customer.state || "").trim()
    );
  }, [customer]);

  if (!customer) {
    return null;
  }

  // Account Health calculations from customer data
  const outstandingAmount = Number(
    customer.outstandingAmount !== undefined
      ? customer.outstandingAmount
      : customer.openingBalance || 0,
  );
  const creditLimit = Number(customer.creditLimit || 0);
  const utilization =
    creditLimit > 0
      ? Math.min(100, Math.round((outstandingAmount / creditLimit) * 100))
      : 0;

  const financialStatus =
    customer.financialStatus ||
    (outstandingAmount > 20000
      ? "critical"
      : outstandingAmount > 0
        ? "warning"
        : "healthy");

  const paymentStatusText =
    customer.paymentStatus ||
    (financialStatus === "critical"
      ? "Collections - Hold"
      : financialStatus === "warning"
        ? "14 Days Overdue"
        : customer.paymentTerms
          ? `Net ${String(customer.paymentTerms).replace("_days", "")} (Current)`
          : "Net 30 (Current)");

  let healthColor = "text-emerald-600 dark:text-emerald-400";
  let healthBorder = "border-emerald-200 dark:border-emerald-800/40";
  let healthBg = "bg-emerald-50/70 dark:bg-emerald-950/30";
  let healthIcon = "check_circle";
  let healthLabel = "Healthy Standing";

  if (financialStatus === "warning" || financialStatus === "overdue") {
    healthColor = "text-amber-600 dark:text-amber-400";
    healthBorder = "border-amber-200 dark:border-amber-800/40";
    healthBg = "bg-amber-50/70 dark:bg-amber-950/30";
    healthIcon = "warning";
    healthLabel = "Attention Required";
  } else if (
    financialStatus === "critical" ||
    financialStatus === "collections"
  ) {
    healthColor = "text-rose-600 dark:text-rose-400";
    healthBorder = "border-rose-200 dark:border-rose-800/40";
    healthBg = "bg-rose-50/70 dark:bg-rose-950/30";
    healthIcon = "error";
    healthLabel = "High Risk / Hold";
  }

  const handleTripAction = () => {
    if (onCreateTrip) {
      onCreateTrip(customer);
    } else if (typeof window !== "undefined") {
      window.location.href = `/trips/new?customerId=${encodeURIComponent(customer.id)}`;
    }
  };

  const isCompany = customer.customerType === "company";
  const isIndividual = customer.customerType === "individual";

  return (
    <Modal
      ref={ref}
      open={open}
      onClose={onClose}
      className="max-w-4xl max-h-[92vh] border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] shadow-2xl rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <ModalHeader className="border-b border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#13151f] px-5 sm:px-6 py-4">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Avatar Icon */}
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-cyan-300 flex items-center justify-center font-bold text-sm select-none shrink-0 shadow-2xs">
            {getCustomerInitials(customer.name)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <ModalTitle className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                {customer.name}
              </ModalTitle>

              {/* Header Status Badge */}
              <span
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide whitespace-nowrap",
                  customer.isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/50"
                    : "bg-slate-100 text-slate-600 border border-slate-300 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700/50",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    customer.isActive ? "bg-emerald-500" : "bg-slate-400",
                  ].join(" ")}
                />
                <span>
                  {customer.isActive ? "Active Account" : "Inactive Account"}
                </span>
              </span>
            </div>

            <ModalDescription className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              {customer.customerCode}
              {" · "}
              {formatCustomerType(customer.customerType)}
            </ModalDescription>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(customer)}
            aria-label="Edit customer profile"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#191b26] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#202330] hover:text-cyan-600 dark:hover:text-cyan-400 shadow-2xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={handleTripAction}
            aria-label="Create trip for customer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Create Trip</span>
          </button>

          <ModalClose onClose={onClose} />
        </div>
      </ModalHeader>

      {/* Body Content */}
      <ModalContent className="p-5 sm:p-6 space-y-5 bg-slate-50/40 dark:bg-[#0f111a]/30">
        {/* Account Health & Financial Standing Overview */}
        <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#202330] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-indigo-600 dark:text-indigo-400 select-none">
                monitoring
              </span>
              <h3 className="text-sm font-semibold text-foreground tracking-tight">
                Account Health & Standing
              </h3>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${healthBg} ${healthColor} ${healthBorder}`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {healthIcon}
              </span>
              <span>{healthLabel}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Tile 1: Outstanding Balance */}
            <div className="rounded-lg border border-slate-100 dark:border-[#202330] bg-slate-50/60 dark:bg-[#191b26] p-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Outstanding Balance
              </span>
              <div
                className={`mt-1 text-lg font-bold tracking-tight ${healthColor}`}
              >
                Due: {formatCurrency(outstandingAmount)}
              </div>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {paymentStatusText}
              </p>
            </div>

            {/* Tile 2: Credit Limit */}
            <div className="rounded-lg border border-slate-100 dark:border-[#202330] bg-slate-50/60 dark:bg-[#191b26] p-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Credit Limit
              </span>
              <div className="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Limit: {formatCurrency(creditLimit)}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Approved credit line
              </p>
            </div>

            {/* Tile 3: Credit Utilization */}
            <div className="rounded-lg border border-slate-100 dark:border-[#202330] bg-slate-50/60 dark:bg-[#191b26] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Credit Utilization
                </span>
                <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-200">
                  {utilization}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    utilization > 80
                      ? "bg-rose-500"
                      : utilization > 50
                        ? "bg-amber-500"
                        : "bg-cyan-500"
                  }`}
                  style={{ width: `${Math.max(4, utilization)}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Avail:{" "}
                {formatCurrency(Math.max(0, creditLimit - outstandingAmount))}
              </p>
            </div>

            {/* Tile 4: Billing Terms & Cycle */}
            <div className="rounded-lg border border-slate-100 dark:border-[#202330] bg-slate-50/60 dark:bg-[#191b26] p-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Terms & Cycle
              </span>
              <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                Net {formatPaymentTerms(customer.paymentTerms)}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Billing: {formatBillingCycle(customer.billingCycle)}
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Customer & Contact Information */}
        <DetailSection title="Customer Information" icon="badge">
          <DetailItem label="Customer Code" value={customer.customerCode} />

          <DetailItem
            label="Registration Date"
            value={formatDate(customer.registrationDate)}
          />

          <DetailItem
            label="Customer Type"
            value={formatCustomerType(customer.customerType)}
          />

          <DetailItem
            label={isCompany ? "Company Name" : "Customer Name"}
            value={customer.name}
          />

          {isIndividual && (
            <DetailItem label="Prefix" value={customer.prefix} />
          )}

          {isCompany && (
            <DetailItem label="Contact Person" value={customer.contactPerson} />
          )}
        </DetailSection>

        {/* Section 2: Contact Details */}
        <DetailSection title="Contact Information" icon="contacts">
          <DetailItem
            label="Mobile No. 1"
            value={customer.mobile1 || customer.phone}
          />

          <DetailItem label="Mobile No. 2" value={customer.mobile2} />

          <DetailItem label="Email" value={customer.email} />

          <DetailItem label="Alternate Email" value={customer.alternateEmail} />
        </DetailSection>

        {/* Section 3: Registered Address */}
        <DetailSection title="Address Information" icon="location_on">
          <div className="sm:col-span-2">
            <DetailItem label="Address" value={customer.address} />
          </div>

          <DetailItem label="City" value={customer.city} />

          <DetailItem label="State" value={customer.state} />

          <DetailItem label="State Code" value={customer.stateCode} />

          <DetailItem
            label="PIN Code"
            value={customer.pinCode || customer.postalCode}
          />
        </DetailSection>

        {/* Section 4: Tax & Billing Information */}
        <DetailSection
          title="Tax & Billing Information"
          icon="receipt_long"
          badge={
            isSameBillingAddress ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800/40">
                <span className="material-symbols-outlined text-[14px]">
                  check
                </span>
                Same as Registered
              </span>
            ) : null
          }
        >
          <DetailItem
            label="GST No."
            value={customer.gstNumber || customer.gstin}
          />

          <DetailItem label="PAN" value={customer.pan} />

          <DetailItem
            label="Customer Vendor Code"
            value={
              customer.vendorCode ||
              customer.customerVendorCode ||
              customer.customerReference
            }
          />

          <DetailItem label="Billing Name" value={customer.billingName} />

          <div className="sm:col-span-2">
            <DetailItem
              label="Billing Address"
              value={customer.billingAddress}
            />
          </div>

          <DetailItem label="Billing City" value={customer.billingCity} />

          <DetailItem label="Billing State" value={customer.billingState} />

          <DetailItem
            label="Billing State Code"
            value={customer.billingStateCode}
          />

          <DetailItem
            label="Billing PIN Code"
            value={customer.billingPinCode || customer.billingPincode}
          />
        </DetailSection>

        {/* Section 5: Financial Context */}
        <DetailSection
          title="Financial & Account Information"
          icon="account_balance_wallet"
        >
          <DetailItem
            label="Opening Balance"
            value={formatCurrency(customer.openingBalance)}
          />

          <DetailItem
            label="Opening Balance Type"
            value={formatOpeningBalanceType(customer.openingBalanceType)}
          />

          <DetailItem
            label="Credit Limit"
            value={formatCurrency(customer.creditLimit)}
          />

          <DetailItem
            label="Payment Terms"
            value={formatPaymentTerms(customer.paymentTerms)}
          />

          <DetailItem
            label="Billing Cycle"
            value={formatBillingCycle(customer.billingCycle)}
          />
        </DetailSection>

        {/* Section 6: Additional Information */}
        <DetailSection title="Additional Information" icon="info">
          {isIndividual && (
            <>
              <DetailItem
                label="Date of Birth"
                value={formatDate(customer.dateOfBirth)}
              />

              <DetailItem
                label="Marriage Date"
                value={formatDate(customer.marriageDate)}
              />
            </>
          )}

          <div className="sm:col-span-2">
            <DetailItem label="Notes" value={customer.notes} />
          </div>

          <DetailItem
            label="Customer Status"
            value={customer.isActive ? "Active" : "Inactive"}
          />
        </DetailSection>
      </ModalContent>

      {/* Footer */}
      <ModalFooter className="border-t border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#13151f] px-5 sm:px-6 py-3.5 flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          className="border-slate-200 dark:border-[#262837] bg-white dark:bg-[#191b26] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#202330]"
        >
          Close
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onEdit(customer)}
            className="border-slate-200 dark:border-[#262837] bg-white dark:bg-[#191b26] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#202330]"
          >
            <span
              className="material-symbols-outlined text-[16px] mr-1.5"
              aria-hidden="true"
            >
              edit
            </span>
            Edit Customer
          </Button>

          <button
            type="button"
            onClick={handleTripAction}
            aria-label="Create Trip"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] active:opacity-90 rounded-md shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              aria-hidden="true"
            >
              add
            </span>
            <span>Create Trip</span>
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
});

export default CustomerDetailsModal;
