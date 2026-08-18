import { forwardRef } from "react";

const Table = forwardRef(function Table(
  { children, className = "", ...props },
  ref,
) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table
        ref={ref}
        className={["w-full border-collapse text-sm", className].join(" ")}
        {...props}
      >
        {children}
      </table>
    </div>
  );
});

const TableHeader = forwardRef(function TableHeader(
  { children, className = "", ...props },
  ref,
) {
  return (
    <thead
      ref={ref}
      className={["bg-background", className].join(" ")}
      {...props}
    >
      {children}
    </thead>
  );
});

const TableBody = forwardRef(function TableBody(
  { children, className = "", ...props },
  ref,
) {
  return (
    <tbody ref={ref} className={className} {...props}>
      {children}
    </tbody>
  );
});

const TableFooter = forwardRef(function TableFooter(
  { children, className = "", ...props },
  ref,
) {
  return (
    <tfoot
      ref={ref}
      className={["border-t border-border bg-background", className].join(" ")}
      {...props}
    >
      {children}
    </tfoot>
  );
});

const TableRow = forwardRef(function TableRow(
  { children, className = "", ...props },
  ref,
) {
  return (
    <tr
      ref={ref}
      className={[
        "border-b border-border",
        "transition-colors",
        "hover:bg-background",
        "last:border-b-0",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </tr>
  );
});

const TableHead = forwardRef(function TableHead(
  { children, className = "", ...props },
  ref,
) {
  return (
    <th
      ref={ref}
      scope="col"
      className={[
        "px-4 py-3",
        "text-left text-xs font-semibold",
        "uppercase tracking-wide",
        "text-muted",
        "whitespace-nowrap",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </th>
  );
});

const TableCell = forwardRef(function TableCell(
  { children, className = "", ...props },
  ref,
) {
  return (
    <td
      ref={ref}
      className={["px-4 py-3", "text-sm text-foreground", className].join(" ")}
      {...props}
    >
      {children}
    </td>
  );
});

const TableCaption = forwardRef(function TableCaption(
  { children, className = "", ...props },
  ref,
) {
  return (
    <caption
      ref={ref}
      className={["mt-3 text-left text-sm text-muted", className].join(" ")}
      {...props}
    >
      {children}
    </caption>
  );
});

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};

export default Table;
