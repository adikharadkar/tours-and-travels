import Card, { CardContent } from "../../components/ui/Card";

import Button from "../../components/ui/Button";

import { getCustomerAccountStatus } from "../../utils/customerAccountStatus";

const STATUS_CLASSES = {
  active: "bg-success/10 text-success",
  inactive: "bg-muted/20 text-muted",

  no_dues: "bg-success/10 text-success",
  due: "bg-warning/10 text-warning",
  overdue: "bg-error/10 text-error",
  credit: "bg-primary/10 text-primary",
};

function StatusBadge({ value, label }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1",
        "text-xs font-medium",
        STATUS_CLASSES[value] ?? "bg-muted/20 text-muted",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

export default function CustomerCard({
  customer,
  onView,
  onEdit,
  onDelete,
  highlighted = false,
}) {
  const accountStatus = getCustomerAccountStatus(customer);

  const customerStatus = customer.isActive
    ? {
        value: "active",
        label: "Active",
      }
    : {
        value: "inactive",
        label: "Inactive",
      };

  return (
    <Card className={highlighted ? "ring-2 ring-primary/30" : ""}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {customer.name}
            </h3>

            <p className="mt-1 text-xs text-muted">
              {customer.customerCode}
              {" · "}
              {customer.customerType === "company" ? "Company" : "Individual"}
            </p>
          </div>

          <StatusBadge
            value={customerStatus.value}
            label={customerStatus.label}
          />
        </div>

        {/* Details */}
        <div className="mt-4 space-y-2">
          {customer.contactPerson && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted">Contact Person</span>

              <span className="truncate text-sm text-foreground">
                {customer.contactPerson}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted">Mobile</span>

            <span className="text-sm text-foreground">
              {customer.mobile1 || "-"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted">Account</span>

            <StatusBadge
              value={accountStatus.value}
              label={accountStatus.label}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onView(customer)}
          >
            View
          </Button>

          <Button type="button" onClick={() => onEdit(customer)}>
            Edit
          </Button>

          <Button
            type="button"
            variant="danger"
            onClick={() => onDelete(customer)}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
