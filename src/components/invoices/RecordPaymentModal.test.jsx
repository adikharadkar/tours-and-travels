import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import RecordPaymentModal from "./RecordPaymentModal";

// --- Mocks -----------------------------------------------------------

vi.mock("../ui/Modal", () => {
  const Modal = ({ open, children }) =>
    open ? <div data-testid="modal">{children}</div> : null;
  Modal.displayName = "Modal";

  const ModalHeader = ({ children }) => <div>{children}</div>;
  const ModalTitle = ({ children, ...props }) => <h2 {...props}>{children}</h2>;
  const ModalDescription = ({ children, ...props }) => (
    <p {...props}>{children}</p>
  );
  const ModalContent = ({ children }) => <div>{children}</div>;
  const ModalFooter = ({ children }) => <div>{children}</div>;

  return {
    __esModule: true,
    default: Modal,
    ModalHeader,
    ModalTitle,
    ModalDescription,
    ModalContent,
    ModalFooter,
  };
});

vi.mock("../ui/Button", () => ({
  __esModule: true,
  default: ({ children, onClick, type = "button", variant, ...rest }) => (
    <button type={type} onClick={onClick} data-variant={variant} {...rest}>
      {children}
    </button>
  ),
}));

vi.mock("../../utils/invoiceStatus", () => ({
  formatINR: (value) => `₹${Number(value || 0).toFixed(2)}`,
}));

// --- Fixtures ----------------------------------------------------------

const baseInvoice = {
  id: "inv_1",
  invoiceNumber: "INV-1001",
  customerName: "Acme Traders",
  totalAmount: 10000,
  paidAmount: 4000,
};

const setup = (overrides = {}) => {
  const onClose = vi.fn();
  const onSavePayment = vi.fn();

  const props = {
    open: true,
    invoice: baseInvoice,
    onClose,
    onSavePayment,
    ...overrides,
  };

  const utils = render(<RecordPaymentModal {...props} />);

  const getAmountInput = () => screen.getByRole("spinbutton");
  const getDateInput = () =>
    utils.container.querySelector('input[type="date"]');
  const getModeSelect = () => screen.getByRole("combobox");
  // Submit via the form element directly, bypassing native HTML5
  // constraint validation (e.g. min="1" on the amount input), so we're
  // testing the component's own JS validation logic, not the browser's.
  const submitForm = () =>
    fireEvent.submit(utils.container.querySelector("form"));

  return {
    ...utils,
    onClose,
    onSavePayment,
    props,
    getAmountInput,
    getDateInput,
    getModeSelect,
    submitForm,
  };
};

// --- Tests ---------------------------------------------------------------

describe("RecordPaymentModal", () => {
  test("renders nothing when invoice is missing", () => {
    const { container } = render(
      <RecordPaymentModal
        open={true}
        invoice={null}
        onClose={vi.fn()}
        onSavePayment={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders nothing when closed", () => {
    const { container } = setup({ open: false });
    expect(container).toBeEmptyDOMElement();
  });

  test("supports legacy isOpen prop when open is undefined", () => {
    render(
      <RecordPaymentModal
        isOpen={true}
        invoice={baseInvoice}
        onClose={vi.fn()}
        onSavePayment={vi.fn()}
      />,
    );
    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });

  test("displays invoice number, customer name, and outstanding balance", () => {
    setup();
    expect(screen.getByText(/Record Payment — INV-1001/)).toBeInTheDocument();
    expect(screen.getByText(/Acme Traders/)).toBeInTheDocument();
    // outstanding = 10000 - 4000 = 6000
    expect(screen.getByText("₹6000.00")).toBeInTheDocument();
  });

  test("defaults payment amount to outstanding balance", () => {
    const { getAmountInput } = setup();
    expect(getAmountInput()).toHaveValue(6000);
  });

  test("resets amount when a new invoice is passed in", () => {
    const { rerender, getAmountInput } = setup();
    const newInvoice = {
      ...baseInvoice,
      id: "inv_2",
      totalAmount: 5000,
      paidAmount: 1000,
    };
    rerender(
      <RecordPaymentModal
        open={true}
        invoice={newInvoice}
        onClose={vi.fn()}
        onSavePayment={vi.fn()}
      />,
    );
    expect(getAmountInput()).toHaveValue(4000);
  });

  test("'Pay full' button sets amount to outstanding balance", () => {
    const { getAmountInput } = setup();
    const amountInput = getAmountInput();
    fireEvent.change(amountInput, { target: { value: "1000" } });
    expect(amountInput).toHaveValue(1000);

    fireEvent.click(screen.getByText(/Pay full/));
    expect(amountInput).toHaveValue(6000);
  });

  test("shows an error when amount is zero or negative", () => {
    const { onSavePayment, getAmountInput } = setup();
    fireEvent.change(getAmountInput(), { target: { value: "0" } });
    fireEvent.click(screen.getByText(/Confirm Payment/));

    expect(
      screen.getByText(/valid payment amount greater than zero/i),
    ).toBeInTheDocument();
    expect(onSavePayment).not.toHaveBeenCalled();
  });

  test("shows an error when amount exceeds outstanding balance", () => {
    const { onSavePayment, getAmountInput } = setup();
    fireEvent.change(getAmountInput(), { target: { value: "9999999" } });
    fireEvent.click(screen.getByText(/Confirm Payment/));

    expect(
      screen.getByText(/cannot exceed outstanding balance/i),
    ).toBeInTheDocument();
    expect(onSavePayment).not.toHaveBeenCalled();
  });

  test("submits a valid payment and closes the modal", () => {
    const {
      onSavePayment,
      onClose,
      getAmountInput,
      getDateInput,
      getModeSelect,
    } = setup();

    fireEvent.change(getAmountInput(), { target: { value: "2500" } });
    fireEvent.change(getDateInput(), { target: { value: "2026-08-25" } });
    fireEvent.change(getModeSelect(), { target: { value: "upi" } });
    fireEvent.change(
      screen.getByPlaceholderText(/UTR \/ NEFT Ref \/ UPI-10829374/),
      { target: { value: "UPI-99988877" } },
    );
    fireEvent.change(screen.getByPlaceholderText(/Optional notes/), {
      target: { value: "Partial payment received" },
    });

    fireEvent.click(screen.getByText(/Confirm Payment/));

    expect(onSavePayment).toHaveBeenCalledWith("inv_1", {
      amount: 2500,
      paymentDate: "2026-08-25",
      paymentMode: "upi",
      referenceNumber: "UPI-99988877",
      notes: "Partial payment received",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("clicking Cancel calls onClose without saving", () => {
    const { onClose, onSavePayment } = setup();
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSavePayment).not.toHaveBeenCalled();
  });

  test("Confirm Payment button label reflects the current amount", () => {
    const { getAmountInput } = setup();
    fireEvent.change(getAmountInput(), { target: { value: "1234" } });
    expect(
      screen.getByText(/Confirm Payment \(₹1234.00\)/),
    ).toBeInTheDocument();
  });

  test("treats fully paid invoice as zero outstanding", () => {
    const { getAmountInput } = setup({
      invoice: { ...baseInvoice, totalAmount: 5000, paidAmount: 5000 },
    });
    expect(getAmountInput()).toHaveValue(0);
    fireEvent.click(screen.getByText(/Confirm Payment/));
    expect(
      screen.getByText(/valid payment amount greater than zero/i),
    ).toBeInTheDocument();
  });
});
