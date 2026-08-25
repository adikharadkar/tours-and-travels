import { numberToWordsINR } from "../../utils/numberToWords";

export default function InvoiceSummaryCard({ taxCalculationResult }) {
  const {
    subtotal = 0,
    taxRows = [],
    roundOff = 0,
    grandTotal = 0,
  } = taxCalculationResult || {};

  const amountInWords = numberToWordsINR(grandTotal);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-xs transition-colors space-y-4">
      {/* Header */}
      <div className="border-b border-border pb-3">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
          INVOICE SUMMARY
        </span>
      </div>

      {/* Subtotal & Taxes Breakdown */}
      <div className="space-y-2.5 text-xs">
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-muted font-medium">Subtotal</span>
          <span className="font-mono font-bold text-foreground">
            ₹
            {Number(subtotal).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* Dynamic Tax Rows (CGST + SGST or IGST) */}
        {taxRows.length > 0 ? (
          taxRows.map((tax, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-muted"
            >
              <span className="font-medium">{tax.name}</span>
              <span className="font-mono font-semibold text-foreground">
                ₹
                {Number(tax.amount).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-between text-muted">
            <span className="font-medium">GST (0%)</span>
            <span className="font-mono font-semibold text-foreground">
              ₹0.00
            </span>
          </div>
        )}

        {/* Round Off if applicable */}
        {roundOff !== 0 && (
          <div className="flex items-center justify-between text-muted">
            <span className="font-medium">Round Off</span>
            <span className="font-mono font-semibold text-foreground">
              {roundOff > 0 ? "+" : ""}₹
              {Number(roundOff).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border pt-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-bold text-foreground">Grand Total</span>
          <span className="font-mono text-2xl font-bold text-primary">
            ₹
            {Number(grandTotal).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        {/* Amount in words */}
        <p className="mt-3 text-[11px] text-muted leading-normal italic text-right">
          Amount in words: {amountInWords}
        </p>
      </div>
    </div>
  );
}
