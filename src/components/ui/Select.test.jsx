import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Select from "./Select";

const options = (
  <>
    <option value="">Select status</option>
    <option value="paid">Paid</option>
    <option value="pending">Pending</option>
    <option value="overdue">Overdue</option>
  </>
);

describe("Select", () => {
  it("renders correctly", () => {
    render(<Select aria-label="Status">{options}</Select>);

    expect(
      screen.getByRole("combobox", { name: "Status" }),
    ).toBeInTheDocument();
  });

  it("renders its options", () => {
    render(<Select aria-label="Status">{options}</Select>);

    expect(screen.getByRole("option", { name: "Paid" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Pending" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Overdue" })).toBeInTheDocument();
  });

  it("supports a default value", () => {
    render(
      <Select aria-label="Status" defaultValue="pending">
        {options}
      </Select>,
    );

    expect(screen.getByRole("combobox", { name: "Status" })).toHaveValue(
      "pending",
    );
  });

  it("allows the user to change the selected option", async () => {
    const user = userEvent.setup();

    render(
      <Select aria-label="Status" defaultValue="">
        {options}
      </Select>,
    );

    const select = screen.getByRole("combobox", {
      name: "Status",
    });

    await user.selectOptions(select, "paid");

    expect(select).toHaveValue("paid");
  });

  it("can be disabled", () => {
    render(
      <Select aria-label="Status" disabled>
        {options}
      </Select>,
    );

    expect(screen.getByRole("combobox", { name: "Status" })).toBeDisabled();
  });

  it("accepts custom classes", () => {
    render(
      <Select aria-label="Status" className="custom-select">
        {options}
      </Select>,
    );

    expect(screen.getByRole("combobox", { name: "Status" })).toHaveClass(
      "custom-select",
    );
  });

  it("forwards the ref", () => {
    const ref = { current: null };

    render(
      <Select ref={ref} aria-label="Status">
        {options}
      </Select>,
    );

    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });
});
