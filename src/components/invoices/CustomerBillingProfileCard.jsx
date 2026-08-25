import { formatPaymentTerms } from "../../utils/tripToInvoice";

export default function CustomerBillingProfileCard({
  customer,
  onEditCustomer,
}) {
  if (!customer) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
            Customer Billing Profile
          </span>
        </div>
        <div className="py-6 text-center text-xs text-muted">
          No customer profile selected
        </div>
      </div>
    );
  }

  const customerName = customer.name || "Customer";
  const billingName =
    customer.billingName && customer.billingName !== customer.name
      ? customer.billingName
      : null;

  const addressLines = [
    customer.billingAddress || customer.address,
    [
      customer.billingCity || customer.city,
      customer.billingState || customer.state,
      customer.billingPinCode ||
        customer.pinCode ||
        customer.billingPincode ||
        customer.postalCode,
    ]
      .filter(Boolean)
      .join(", "),
    "India",
  ].filter(Boolean);

  const formattedAddress =
    addressLines.length > 0 ? addressLines.join("\n") : null;

  const gstin = customer.gstin || customer.gstNumber || "";
  const pan =
    customer.pan || (gstin.length >= 12 ? gstin.substring(2, 12) : null);
  const paymentTermsText = formatPaymentTerms(
    customer.paymentTerms || customer.creditDays
      ? `Net ${customer.creditDays}`
      : "Net 30",
  );
  const vendorCode = customer.vendorCode || customer.customerCode || "—";

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
          CUSTOMER BILLING PROFILE
        </span>
        {onEditCustomer && (
          <button
            type="button"
            onClick={onEditCustomer}
            title="Edit Customer Profile"
            className="inline-flex items-center gap-1 rounded-md p-1 text-muted hover:bg-surface-hover hover:text-primary transition-colors text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
        )}
      </div>

      {/* Customer Info */}
      <div className="mt-4 space-y-3">
        <div>
          <h3 className="text-base font-bold text-foreground">
            {customerName}
          </h3>
          {billingName && (
            <p className="text-xs text-muted mt-0.5 font-medium">
              Billing Name: {billingName}
            </p>
          )}
          {formattedAddress ? (
            <p className="mt-1 text-xs text-muted whitespace-pre-line leading-relaxed">
              {formattedAddress}
            </p>
          ) : (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ Missing billing address
            </p>
          )}
        </div>

        {/* 2-Column Specs Grid */}
        <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div>
            <span className="block font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
              GSTIN
            </span>
            {gstin ? (
              <span className="mt-0.5 block font-mono text-xs font-semibold text-foreground">
                {gstin}
              </span>
            ) : (
              <span className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">
                <span className="material-symbols-outlined text-[14px]">
                  warning
                </span>
                Missing
              </span>
            )}
          </div>

          <div>
            <span className="block font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
              PAN
            </span>
            <span className="mt-0.5 block font-mono text-xs font-semibold text-foreground">
              {pan || "—"}
            </span>
          </div>

          <div>
            <span className="block font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
              Payment Terms
            </span>
            <span className="mt-0.5 block text-xs font-semibold text-foreground">
              {paymentTermsText}
            </span>
          </div>

          <div>
            <span className="block font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
              Vendor Code / Ref
            </span>
            <span className="mt-0.5 block font-mono text-xs font-medium text-foreground">
              {vendorCode}
            </span>
          </div>
        </div>

        {/* Customer contact person if available */}
        {customer.contactPerson && (
          <div className="border-t border-border pt-3 text-[11px] text-muted flex items-center justify-between">
            <span>Contact: {customer.contactPerson}</span>
            {customer.mobile1 && <span>{customer.mobile1}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
