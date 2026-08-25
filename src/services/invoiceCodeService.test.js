import { describe, test, expect, vi, beforeEach } from "vitest";
import { getNextInvoiceCode } from "./invoiceCodeService"; // adjust path to the actual file
import { generateInvoiceCode } from "../utils/invoiceCode";

const INVOICE_SEQUENCE_KEY = "invoice_sequence";

vi.mock("../utils/invoiceCode", () => ({
  generateInvoiceCode: vi.fn(
    (documentType, sequence, isDraft) =>
      `MOCK-${documentType}-${sequence}-${isDraft}`,
  ),
}));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("getNextInvoiceCode", () => {
  test("starts sequence at 1 when nothing is stored", () => {
    const code = getNextInvoiceCode();

    expect(localStorage.getItem(INVOICE_SEQUENCE_KEY)).toBe("1");
    expect(generateInvoiceCode).toHaveBeenCalledWith("tax_invoice", 1, false);
    expect(code).toBe("MOCK-tax_invoice-1-false");
  });

  test("derives starting sequence from existing invoices array when no sequence is stored", () => {
    localStorage.setItem(
      "invoices",
      JSON.stringify([{ id: 1 }, { id: 2 }, { id: 3 }]),
    );

    getNextInvoiceCode();

    // currentSequence = 3 (array length), nextSequence = 4
    expect(localStorage.getItem(INVOICE_SEQUENCE_KEY)).toBe("4");
    expect(generateInvoiceCode).toHaveBeenCalledWith("tax_invoice", 4, false);
  });

  test("ignores invoices key and falls back to 1 when it is not an array", () => {
    localStorage.setItem("invoices", JSON.stringify({ not: "an array" }));

    getNextInvoiceCode();

    expect(localStorage.getItem(INVOICE_SEQUENCE_KEY)).toBe("1");
    expect(generateInvoiceCode).toHaveBeenCalledWith("tax_invoice", 1, false);
  });

  test("falls back to sequence 85 when stored invoices JSON is malformed", () => {
    localStorage.setItem("invoices", "{not valid json");

    getNextInvoiceCode();

    // catch block sets currentSequence = 84, nextSequence = 85
    expect(localStorage.getItem(INVOICE_SEQUENCE_KEY)).toBe("85");
    expect(generateInvoiceCode).toHaveBeenCalledWith("tax_invoice", 85, false);
  });

  test("ignores invoices key entirely when a sequence is already stored", () => {
    localStorage.setItem(INVOICE_SEQUENCE_KEY, "10");
    localStorage.setItem("invoices", JSON.stringify([{ id: 1 }])); // would imply seq 1, should be ignored

    getNextInvoiceCode();

    expect(localStorage.getItem(INVOICE_SEQUENCE_KEY)).toBe("11");
    expect(generateInvoiceCode).toHaveBeenCalledWith("tax_invoice", 11, false);
  });

  test("treats a stored sequence of '0' the same as no sequence at all", () => {
    localStorage.setItem(INVOICE_SEQUENCE_KEY, "0");
    localStorage.setItem("invoices", JSON.stringify([{ id: 1 }, { id: 2 }]));

    getNextInvoiceCode();

    // Number("0") === 0, so it falls into the invoices-array branch (length 2)
    expect(localStorage.getItem(INVOICE_SEQUENCE_KEY)).toBe("3");
    expect(generateInvoiceCode).toHaveBeenCalledWith("tax_invoice", 3, false);
  });

  test("increments correctly across multiple sequential calls", () => {
    getNextInvoiceCode(); // -> 1
    getNextInvoiceCode(); // -> 2
    getNextInvoiceCode(); // -> 3

    expect(localStorage.getItem(INVOICE_SEQUENCE_KEY)).toBe("3");
    expect(generateInvoiceCode).toHaveBeenNthCalledWith(
      1,
      "tax_invoice",
      1,
      false,
    );
    expect(generateInvoiceCode).toHaveBeenNthCalledWith(
      2,
      "tax_invoice",
      2,
      false,
    );
    expect(generateInvoiceCode).toHaveBeenNthCalledWith(
      3,
      "tax_invoice",
      3,
      false,
    );
  });

  test("passes through a custom documentType", () => {
    getNextInvoiceCode("proforma_invoice");

    expect(generateInvoiceCode).toHaveBeenCalledWith(
      "proforma_invoice",
      1,
      false,
    );
  });

  test("passes through isDraft = true", () => {
    getNextInvoiceCode("tax_invoice", true);

    expect(generateInvoiceCode).toHaveBeenCalledWith("tax_invoice", 1, true);
  });

  test("returns whatever generateInvoiceCode produces", () => {
    generateInvoiceCode.mockReturnValueOnce("TI-2026-0001");

    const result = getNextInvoiceCode();

    expect(result).toBe("TI-2026-0001");
  });

  test("does not mutate the invoices key in localStorage", () => {
    const invoices = [{ id: 1 }, { id: 2 }];
    localStorage.setItem("invoices", JSON.stringify(invoices));

    getNextInvoiceCode();

    expect(JSON.parse(localStorage.getItem("invoices"))).toEqual(invoices);
  });
});
