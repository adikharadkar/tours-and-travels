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

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
};

const formatCustomerType = (value) => {
  if (value === "company") {
    return "Company";
  }

  if (value === "individual") {
    return "Individual";
  }

  return "—";
};

const formatPaymentTerms = (value) => {
  const labels = {
    immediate: "Immediate",
    "15_days": "15 Days",
    "30_days": "30 Days",
    "45_days": "45 Days",
    "60_days": "60 Days",
  };

  return labels[value] ?? "—";
};

const formatBillingCycle = (value) => {
  const labels = {
    per_trip: "Per Trip",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
  };

  return labels[value] ?? "—";
};

const formatOpeningBalanceType = (value) => {
  if (value === "debit") {
    return "Debit";
  }

  if (value === "credit") {
    return "Credit";
  }

  return "—";
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

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return value;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>

      <p className="mt-1 break-words text-sm text-foreground">
        {formatValue(value)}
      </p>
    </div>
  );
}

function DetailSection({ title, children, className = "" }) {
  return (
    <section className={className}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>

      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

const CustomerDetailsModal = forwardRef(function CustomerDetailsModal(
  { open, customer, onClose, onEdit },
  ref,
) {
  if (!customer) {
    return null;
  }

  return (
    <Modal ref={ref} open={open} onClose={onClose} className="max-w-4xl">
      <ModalHeader>
        <div className="min-w-0">
          <ModalTitle>{customer.name}</ModalTitle>

          <ModalDescription>
            {customer.customerCode}
            {" · "}
            {formatCustomerType(customer.customerType)}
          </ModalDescription>
        </div>

        <ModalClose onClose={onClose} />
      </ModalHeader>

      <ModalContent>
        <div className="space-y-8">
          {/* Customer Information */}
          <DetailSection title="Customer Information">
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
              label={
                customer.customerType === "company"
                  ? "Company Name"
                  : "Customer Name"
              }
              value={customer.name}
            />

            {customer.customerType === "individual" && (
              <DetailItem label="Prefix" value={customer.prefix} />
            )}

            {customer.customerType === "company" && (
              <DetailItem
                label="Contact Person"
                value={customer.contactPerson}
              />
            )}
          </DetailSection>

          {/* Contact Information */}
          <DetailSection title="Contact Information">
            <DetailItem label="Mobile No. 1" value={customer.mobile1} />

            <DetailItem label="Mobile No. 2" value={customer.mobile2} />

            <DetailItem label="Email" value={customer.email} />

            <DetailItem
              label="Alternate Email"
              value={customer.alternateEmail}
            />
          </DetailSection>

          {/* Address Information */}
          <DetailSection title="Address Information">
            <div className="md:col-span-2">
              <DetailItem label="Address" value={customer.address} />
            </div>

            <DetailItem label="City" value={customer.city} />

            <DetailItem label="State" value={customer.state} />

            <DetailItem label="State Code" value={customer.stateCode} />

            <DetailItem label="PIN Code" value={customer.pinCode} />
          </DetailSection>

          {/* Tax & Billing */}
          <DetailSection title="Tax & Billing Information">
            <DetailItem label="GST No." value={customer.gstNumber} />

            <DetailItem label="PAN" value={customer.pan} />

            <DetailItem label="Billing Name" value={customer.billingName} />

            <div className="md:col-span-2">
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
              value={customer.billingPinCode}
            />
          </DetailSection>

          {/* Financial Information */}
          <DetailSection title="Financial & Account Information">
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

          {/* Additional Information */}
          <DetailSection title="Additional Information">
            {customer.customerType === "individual" && (
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

            <div className="md:col-span-2">
              <DetailItem label="Notes" value={customer.notes} />
            </div>

            <DetailItem
              label="Customer Status"
              value={customer.isActive ? "Active" : "Inactive"}
            />
          </DetailSection>
        </div>
      </ModalContent>

      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>

        <Button type="button" onClick={() => onEdit(customer)}>
          Edit Customer
        </Button>
      </ModalFooter>
    </Modal>
  );
});

export default CustomerDetailsModal;
