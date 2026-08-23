import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { TripStatusBadge, PaymentStatusBadge } from "./TripStatusBadge";

import {
  getTripStatusBadgeInfo,
  getPaymentStatusBadgeInfo,
} from "../../utils/tripStatus";

vi.mock("../../utils/tripStatus", () => ({
  getTripStatusBadgeInfo: vi.fn(),
  getPaymentStatusBadgeInfo: vi.fn(),
}));

describe("TripStatusBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the label returned by the trip status utility", () => {
    getTripStatusBadgeInfo.mockReturnValue({
      label: "Confirmed",
      variant: "primary",
    });

    render(<TripStatusBadge status="confirmed" />);

    expect(screen.getByText("Confirmed")).toBeInTheDocument();

    expect(getTripStatusBadgeInfo).toHaveBeenCalledTimes(1);

    expect(getTripStatusBadgeInfo).toHaveBeenCalledWith("confirmed");
  });

  it("renders a different label for an in-progress trip", () => {
    getTripStatusBadgeInfo.mockReturnValue({
      label: "In Progress",
      variant: "warning",
    });

    render(<TripStatusBadge status="in_progress" />);

    expect(screen.getByText("In Progress")).toBeInTheDocument();

    expect(getTripStatusBadgeInfo).toHaveBeenCalledWith("in_progress");
  });

  it("renders the completed status", () => {
    getTripStatusBadgeInfo.mockReturnValue({
      label: "Completed",
      variant: "success",
    });

    render(<TripStatusBadge status="completed" />);

    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders the cancelled status", () => {
    getTripStatusBadgeInfo.mockReturnValue({
      label: "Cancelled",
      variant: "danger",
    });

    render(<TripStatusBadge status="cancelled" />);

    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("applies the provided className", () => {
    getTripStatusBadgeInfo.mockReturnValue({
      label: "Confirmed",
      variant: "primary",
    });

    const { container } = render(
      <TripStatusBadge status="confirmed" className="custom-status" />,
    );

    expect(container.querySelector(".custom-status")).toBeInTheDocument();
  });

  it("renders the payment status label returned by the utility", () => {
    getPaymentStatusBadgeInfo.mockReturnValue({
      label: "Paid",
      variant: "success",
    });

    render(<PaymentStatusBadge paymentStatus="paid" />);

    expect(screen.getByText("Paid")).toBeInTheDocument();

    expect(getPaymentStatusBadgeInfo).toHaveBeenCalledTimes(1);

    expect(getPaymentStatusBadgeInfo).toHaveBeenCalledWith("paid");
  });

  it("renders the unpaid payment status", () => {
    getPaymentStatusBadgeInfo.mockReturnValue({
      label: "Unpaid",
      variant: "danger",
    });

    render(<PaymentStatusBadge paymentStatus="unpaid" />);

    expect(screen.getByText("Unpaid")).toBeInTheDocument();
  });

  it("renders the partially paid status", () => {
    getPaymentStatusBadgeInfo.mockReturnValue({
      label: "Partially Paid",
      variant: "warning",
    });

    render(<PaymentStatusBadge paymentStatus="partially_paid" />);

    expect(screen.getByText("Partially Paid")).toBeInTheDocument();
  });

  it("renders the overpaid status", () => {
    getPaymentStatusBadgeInfo.mockReturnValue({
      label: "Overpaid",
      variant: "primary",
    });

    render(<PaymentStatusBadge paymentStatus="overpaid" />);

    expect(screen.getByText("Overpaid")).toBeInTheDocument();
  });

  it("applies className to the payment status badge", () => {
    getPaymentStatusBadgeInfo.mockReturnValue({
      label: "Paid",
      variant: "success",
    });

    const { container } = render(
      <PaymentStatusBadge paymentStatus="paid" className="payment-status" />,
    );

    expect(container.querySelector(".payment-status")).toBeInTheDocument();
  });

  it("renders the fallback label returned by the utility for an unknown trip status", () => {
    getTripStatusBadgeInfo.mockReturnValue({
      label: "Unknown",
      variant: "default",
    });

    render(<TripStatusBadge status="unknown" />);

    expect(screen.getByText("Unknown")).toBeInTheDocument();

    expect(getTripStatusBadgeInfo).toHaveBeenCalledWith("unknown");
  });

  it("renders the fallback label returned by the utility for an unknown payment status", () => {
    getPaymentStatusBadgeInfo.mockReturnValue({
      label: "Unknown",
      variant: "default",
    });

    render(<PaymentStatusBadge paymentStatus="unknown" />);

    expect(screen.getByText("Unknown")).toBeInTheDocument();

    expect(getPaymentStatusBadgeInfo).toHaveBeenCalledWith("unknown");
  });
});
