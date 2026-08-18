import { forwardRef } from "react";

const Card = forwardRef(function Card(
  { children, className = "", ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={[
        "rounded-lg border border-border bg-surface text-foreground shadow-sm",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
});

const CardHeader = forwardRef(function CardHeader(
  { children, className = "", ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={["flex flex-col space-y-1.5 p-6", className].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
});

const CardTitle = forwardRef(function CardTitle(
  { children, className = "", ...props },
  ref,
) {
  return (
    <h3
      ref={ref}
      className={[
        "text-lg font-semibold leading-none tracking-tight",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </h3>
  );
});

const CardDescription = forwardRef(function CardDescription(
  { children, className = "", ...props },
  ref,
) {
  return (
    <p
      ref={ref}
      className={["text-sm text-muted", className].join(" ")}
      {...props}
    >
      {children}
    </p>
  );
});

const CardContent = forwardRef(function CardContent(
  { children, className = "", ...props },
  ref,
) {
  return (
    <div ref={ref} className={["p-6 pt-0", className].join(" ")} {...props}>
      {children}
    </div>
  );
});

const CardFooter = forwardRef(function CardFooter(
  { children, className = "", ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={["flex items-center p-6 pt-0", className].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
});

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};

export default Card;
