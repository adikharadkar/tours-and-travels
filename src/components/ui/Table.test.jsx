import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./Table";

function renderTable() {
  return render(
    <Table>
      <TableCaption>Invoice list</TableCaption>

      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        <TableRow>
          <TableCell>INV-001</TableCell>
          <TableCell>John Doe</TableCell>
          <TableCell>Paid</TableCell>
        </TableRow>

        <TableRow>
          <TableCell>INV-002</TableCell>
          <TableCell>Jane Doe</TableCell>
          <TableCell>Pending</TableCell>
        </TableRow>
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell />
          <TableCell>2 invoices</TableCell>
        </TableRow>
      </TableFooter>
    </Table>,
  );
}

describe("Table", () => {
  it("renders the table", () => {
    renderTable();

    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("renders the table caption", () => {
    renderTable();

    expect(screen.getByText("Invoice list")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    renderTable();

    expect(
      screen.getByRole("columnheader", {
        name: "Invoice",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", {
        name: "Customer",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", {
        name: "Status",
      }),
    ).toBeInTheDocument();
  });

  it("renders table rows", () => {
    renderTable();

    expect(
      screen.getByRole("cell", {
        name: "INV-001",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("cell", {
        name: "INV-002",
      }),
    ).toBeInTheDocument();
  });

  it("renders table cell content", () => {
    renderTable();

    expect(screen.getByText("John Doe")).toBeInTheDocument();

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();

    expect(screen.getByText("Paid")).toBeInTheDocument();

    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders the table footer", () => {
    renderTable();

    expect(screen.getByText("2 invoices")).toBeInTheDocument();
  });

  it("applies custom className to the table", () => {
    render(
      <Table className="custom-table">
        <tbody>
          <tr>
            <td>Test</td>
          </tr>
        </tbody>
      </Table>,
    );

    expect(screen.getByRole("table")).toHaveClass("custom-table");
  });

  it("applies custom className to a row", () => {
    render(
      <Table>
        <tbody>
          <TableRow className="custom-row">
            <TableCell>Test</TableCell>
          </TableRow>
        </tbody>
      </Table>,
    );

    expect(screen.getByRole("row")).toHaveClass("custom-row");
  });

  it("applies custom className to a cell", () => {
    render(
      <Table>
        <tbody>
          <TableRow>
            <TableCell className="custom-cell">Test</TableCell>
          </TableRow>
        </tbody>
      </Table>,
    );

    expect(screen.getByRole("cell")).toHaveClass("custom-cell");
  });
});
