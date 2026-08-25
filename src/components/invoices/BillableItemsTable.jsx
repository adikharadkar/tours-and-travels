import { useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Modal, {
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  ModalClose,
} from "../ui/Modal";

const ITEM_CATEGORIES = [
  { value: "custom", label: "Custom Line Item" },
  { value: "additional_service", label: "Additional Transport Service" },
  { value: "tolls", label: "Highway Toll Charges (At Actuals)" },
  { value: "parking", label: "Parking & Terminal Entry Fee" },
  { value: "driver_allowance", label: "Driver Allowance / Batta" },
  { value: "detention", label: "Detention / Waiting Fee" },
  { value: "loading", label: "Loading / Unloading Support" },
  { value: "fuel_surcharge", label: "Fuel Price Adjustment / Surcharge" },
  { value: "discount", label: "Commercial Concession / Discount" },
];

const TAX_RATES = [
  { value: "18", label: "18% GST (Standard Fleet)" },
  { value: "12", label: "12% GST" },
  { value: "5", label: "5% GST (Passenger Transport)" },
  { value: "0", label: "0% (Exempt / At Actuals)" },
  { value: "28", label: "28% GST" },
];

export default function BillableItemsTable({
  items = [],
  onUpdateItems,
  readOnly = false,
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);

  // Form state for adding/editing item
  const [itemCategory, setItemCategory] = useState("custom");
  const [description, setDescription] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [rate, setRate] = useState("");
  const [taxRate, setTaxRate] = useState("18");
  const [formError, setFormError] = useState("");

  const openAddModal = () => {
    setItemCategory("custom");
    setDescription("");
    setSubtitle("");
    setQuantity("1");
    setRate("");
    setTaxRate("18");
    setFormError("");
    setEditingItemIndex(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (item, index) => {
    setItemCategory(item.category || "custom");
    setDescription(item.description || "");
    setSubtitle(item.subtitle || "");
    setQuantity(String(item.quantity || 1));
    setRate(String(item.rate || 0));
    setTaxRate(String(item.taxRate !== undefined ? item.taxRate : 18));
    setFormError("");
    setEditingItemIndex(index);
    setIsAddModalOpen(true);
  };

  const handleCategoryChange = (categoryValue) => {
    setItemCategory(categoryValue);
    switch (categoryValue) {
      case "tolls":
        setDescription("Toll Charges");
        setSubtitle("Highway toll plaza charges (At Actuals)");
        setTaxRate("0");
        break;
      case "parking":
        setDescription("Parking Charges");
        setSubtitle("Airport / parking lot access fee (At Actuals)");
        setTaxRate("0");
        break;
      case "driver_allowance":
        setDescription("Driver Allowance");
        setSubtitle("Overnight stay and meal allowance");
        setTaxRate("0");
        break;
      case "detention":
        setDescription("Detention / Waiting Fee");
        setSubtitle("Vehicle detention beyond scheduled transit window");
        setTaxRate("18");
        break;
      case "loading":
        setDescription("Loading & Unloading Charges");
        setSubtitle("Cargo handling assistance");
        setTaxRate("18");
        break;
      case "fuel_surcharge":
        setDescription("Fuel Surcharge");
        setSubtitle("Operational fuel cost adjustment");
        setTaxRate("18");
        break;
      case "discount":
        setDescription("Commercial Discount");
        setSubtitle("Special agreed customer concession");
        setTaxRate("0");
        break;
      default:
        if (!description) {
          setDescription("Additional Fleet Service");
          setSubtitle("");
        }
        break;
    }
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setFormError("Item description is required.");
      return;
    }

    const qty = Number(quantity);
    const itemRate = Number(rate);
    const itemTax = Number(taxRate);

    if (isNaN(qty) || qty <= 0) {
      setFormError("Quantity must be greater than 0.");
      return;
    }

    if (isNaN(itemRate)) {
      setFormError("Please enter a valid rate.");
      return;
    }

    const isDiscount = itemCategory === "discount";
    const finalRate = isDiscount ? -Math.abs(itemRate) : itemRate;
    const finalAmount = Number((qty * finalRate).toFixed(2));

    const newItem = {
      id:
        editingItemIndex !== null
          ? items[editingItemIndex].id
          : `item_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      description: description.trim(),
      subtitle: subtitle.trim(),
      quantity: qty,
      rate: finalRate,
      taxRate: isDiscount ? 0 : itemTax,
      amount: finalAmount,
      category: itemCategory,
      isDerived:
        editingItemIndex !== null ? items[editingItemIndex].isDerived : false,
    };

    let updatedList;
    if (editingItemIndex !== null) {
      updatedList = [...items];
      updatedList[editingItemIndex] = newItem;
    } else {
      updatedList = [...items, newItem];
    }

    onUpdateItems(updatedList);
    setIsAddModalOpen(false);
  };

  const handleDeleteItem = (index) => {
    const updated = items.filter((_, idx) => idx !== index);
    onUpdateItems(updated);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs transition-colors overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-5">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
          BILLABLE ITEMS
        </span>
        {!readOnly && (
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <span className="text-base leading-none font-bold">+</span>
            <span>Add Item</span>
          </button>
        )}
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-surface/50 text-[11px] font-semibold text-muted tracking-wider">
              <th className="py-3 px-5">Description</th>
              <th className="py-3 px-3 text-right">Qty</th>
              <th className="py-3 px-3 text-right">Rate (₹)</th>
              <th className="py-3 px-3 text-right">Tax (%)</th>
              <th className="py-3 px-5 text-right">Amount (₹)</th>
              {!readOnly && <th className="py-3 px-3 text-center w-12"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-sans">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={readOnly ? 5 : 6}
                  className="py-8 text-center text-xs text-muted"
                >
                  No billable items added yet. Click &ldquo;+ Add Item&rdquo; to
                  add charges.
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const isDiscount = Number(item.amount || 0) < 0;

                return (
                  <tr
                    key={item.id || index}
                    className="hover:bg-surface/40 transition-colors group"
                  >
                    {/* Description & Subtitle */}
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-foreground">
                        {item.description}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-muted mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </td>

                    {/* Qty */}
                    <td className="py-3.5 px-3 text-right font-mono font-medium text-foreground">
                      {item.quantity}
                    </td>

                    {/* Rate */}
                    <td className="py-3.5 px-3 text-right font-mono font-medium text-foreground">
                      {Number(Math.abs(item.rate || 0)).toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </td>

                    {/* Tax % */}
                    <td className="py-3.5 px-3 text-right font-mono font-medium text-muted">
                      {item.taxRate !== undefined ? `${item.taxRate}` : "0"}
                    </td>

                    {/* Amount */}
                    <td
                      className={`py-3.5 px-5 text-right font-mono font-bold text-sm ${
                        isDiscount
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground"
                      }`}
                    >
                      {isDiscount ? "-" : ""}
                      {Number(Math.abs(item.amount || 0)).toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}
                    </td>

                    {/* Actions */}
                    {!readOnly && (
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => openEditModal(item, index)}
                            title="Edit Item"
                            className="rounded p-1 text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              edit
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(index)}
                            title="Remove Item"
                            className="rounded p-1 text-muted hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Item Modal */}
      {isAddModalOpen && (
        <Modal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          className="max-w-md"
        >
          <form onSubmit={handleSaveItem}>
            <ModalHeader>
              <div>
                <ModalTitle>
                  {editingItemIndex !== null
                    ? "Edit Billable Item"
                    : "Add Billable Item"}
                </ModalTitle>
                <ModalDescription>
                  Enter custom charge details, tolls, allowances, or
                  concessions.
                </ModalDescription>
              </div>
              <ModalClose onClose={() => setIsAddModalOpen(false)} />
            </ModalHeader>

            <ModalContent className="space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium">
                  {formError}
                </div>
              )}

              {/* Category Preset */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Item Category
                </label>
                <Select
                  value={itemCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  options={ITEM_CATEGORIES}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Item Description *
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Standard Freight Package, Toll Charges"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* Subtitle / Context Note */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Charge Origin / Subtitle (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Base charge for route, NH48 Tolls"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </div>

              {/* Qty, Rate, Tax Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Quantity *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Rate (₹) *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Tax (%)
                  </label>
                  <Select
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    options={TAX_RATES}
                  />
                </div>
              </div>

              {/* Computed Line Total Preview */}
              {rate &&
                quantity &&
                !isNaN(Number(rate)) &&
                !isNaN(Number(quantity)) && (
                  <div className="p-2.5 rounded-md bg-surface border border-border flex items-center justify-between text-xs">
                    <span className="text-muted">Calculated Line Amount:</span>
                    <span className="font-mono font-bold text-foreground">
                      ₹
                      {(
                        Number(quantity) *
                        (itemCategory === "discount"
                          ? -Math.abs(Number(rate))
                          : Number(rate))
                      ).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
            </ModalContent>

            <ModalFooter className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editingItemIndex !== null ? "Save Changes" : "Add Item"}
              </Button>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  );
}
