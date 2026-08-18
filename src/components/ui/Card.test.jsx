import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Card, {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./Card";

describe("Card", () => {
  it("renders correctly", () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>,
    );

    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("renders all card sections", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>

          <CardDescription>Your latest invoices.</CardDescription>
        </CardHeader>

        <CardContent>Invoice content</CardContent>

        <CardFooter>Footer content</CardFooter>
      </Card>,
    );

    expect(
      screen.getByRole("heading", {
        name: "Recent Invoices",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Your latest invoices.")).toBeInTheDocument();

    expect(screen.getByText("Invoice content")).toBeInTheDocument();

    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });

  it("accepts custom classes", () => {
    render(<Card className="custom-card">Card content</Card>);

    expect(screen.getByText("Card content")).toHaveClass("custom-card");
  });

  it("forwards the ref", () => {
    const ref = { current: null };

    render(<Card ref={ref}>Card content</Card>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("supports custom classes on sections", () => {
    render(
      <Card>
        <CardHeader className="custom-header">Header</CardHeader>

        <CardContent className="custom-content">Content</CardContent>

        <CardFooter className="custom-footer">Footer</CardFooter>
      </Card>,
    );

    expect(screen.getByText("Header")).toHaveClass("custom-header");

    expect(screen.getByText("Content")).toHaveClass("custom-content");

    expect(screen.getByText("Footer")).toHaveClass("custom-footer");
  });
});
