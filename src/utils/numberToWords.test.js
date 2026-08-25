import { describe, it, expect } from "vitest";
import { numberToWordsINR } from "./numberToWords";

describe("numberToWordsINR", () => {
  it("converts 0 to 'Zero rupees only.'", () => {
    expect(numberToWordsINR(0)).toBe("Zero rupees only.");
  });

  it("converts single digit amounts", () => {
    expect(numberToWordsINR(5)).toBe("Five rupees only.");
  });

  it("converts tens and hundreds", () => {
    expect(numberToWordsINR(85)).toBe("Eighty-five rupees only.");
    expect(numberToWordsINR(700)).toBe("Seven hundred rupees only.");
  });

  it("converts thousands (e.g. 59,025 matching the Stitch design)", () => {
    expect(numberToWordsINR(59025)).toBe(
      "Fifty-nine thousand twenty-five rupees only.",
    );
  });

  it("converts lakhs and crores", () => {
    expect(numberToWordsINR(150000)).toBe(
      "One lakh fifty thousand rupees only.",
    );
    expect(numberToWordsINR(25000000)).toBe(
      "Two crore fifty lakh rupees only.",
    );
  });

  it("handles decimal paise correctly", () => {
    expect(numberToWordsINR(50700.5)).toBe(
      "Fifty thousand seven hundred rupees and fifty paise only.",
    );
  });
});
