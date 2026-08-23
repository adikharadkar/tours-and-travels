import Badge from "../ui/Badge";
import {
  getTripStatusBadgeInfo,
  getPaymentStatusBadgeInfo,
} from "../../utils/tripStatus";

export function TripStatusBadge({ status, className = "" }) {
  const info = getTripStatusBadgeInfo(status);

  return (
    <Badge variant={info.variant} className={className}>
      {info.label}
    </Badge>
  );
}

export function PaymentStatusBadge({ paymentStatus, className = "" }) {
  const info = getPaymentStatusBadgeInfo(paymentStatus);

  return (
    <Badge variant={info.variant} className={className}>
      {info.label}
    </Badge>
  );
}

export default TripStatusBadge;
