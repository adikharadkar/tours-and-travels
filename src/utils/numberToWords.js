/**
 * Converts a numerical amount in Indian Rupees (INR) to words following
 * the Indian numbering system (Crores, Lakhs, Thousands, Hundreds).
 *
 * Example: 59025 -> "Fifty-nine thousand twenty-five rupees only."
 * Example: 50700.50 -> "Fifty thousand seven hundred rupees and fifty paise only."
 */

const ONES = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

function convertTwoDigits(num) {
  if (num === 0) return "";
  if (num < 20) return ONES[num];
  const ten = Math.floor(num / 10);
  const unit = num % 10;
  return unit ? `${TENS[ten]}-${ONES[unit]}` : TENS[ten];
}

function convertThreeDigits(num) {
  const hundred = Math.floor(num / 100);
  const remainder = num % 100;
  const parts = [];

  if (hundred > 0) {
    parts.push(`${ONES[hundred]} hundred`);
  }

  if (remainder > 0) {
    parts.push(convertTwoDigits(remainder));
  }

  return parts.join(" ");
}

export function numberToWordsINR(amount) {
  const num = Number(amount);
  if (isNaN(num) || num === 0) {
    return "Zero rupees only.";
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const integerPart = Math.floor(absNum);
  const decimalPart = Math.round((absNum - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) {
    return "Zero rupees only.";
  }

  const crores = Math.floor(integerPart / 10000000);
  const remainderAfterCrores = integerPart % 10000000;

  const lakhs = Math.floor(remainderAfterCrores / 100000);
  const remainderAfterLakhs = remainderAfterCrores % 100000;

  const thousands = Math.floor(remainderAfterLakhs / 1000);
  const remainderAfterThousands = remainderAfterLakhs % 1000;

  const hundredsAndUnits = remainderAfterThousands;

  const parts = [];

  if (crores > 0) {
    parts.push(`${convertThreeDigits(crores)} crore`);
  }

  if (lakhs > 0) {
    parts.push(`${convertTwoDigits(lakhs)} lakh`);
  }

  if (thousands > 0) {
    parts.push(`${convertTwoDigits(thousands)} thousand`);
  }

  if (hundredsAndUnits > 0) {
    parts.push(convertThreeDigits(hundredsAndUnits));
  }

  let words = parts.filter(Boolean).join(" ").trim();
  if (!words) {
    words = "zero";
  }

  // Capitalize first character
  words = words.charAt(0).toUpperCase() + words.slice(1);

  let result = words + " rupees";

  if (decimalPart > 0) {
    const paiseWords = convertTwoDigits(decimalPart);
    result += ` and ${paiseWords} paise`;
  }

  result += " only.";

  if (isNegative) {
    result = `Minus ${result.charAt(0).toLowerCase()}${result.slice(1)}`;
  }

  return result;
}
