import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, afterEach } from "vitest";

import Toast from "./Toast";

describe("Toast", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the title", () => {
    render(
      <Toast
        id="1"
        title="Success"
        message="Invoice created."
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Success")).toBeInTheDocument();
  });

  it("renders the message", () => {
    render(
      <Toast
        id="1"
        title="Success"
        message="Invoice created."
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Invoice created.")).toBeInTheDocument();
  });

  it("renders without a title", () => {
    render(<Toast id="1" message="Invoice created." onClose={vi.fn()} />);

    expect(screen.getByText("Invoice created.")).toBeInTheDocument();
  });

  it("renders without a message", () => {
    render(<Toast id="1" title="Success" onClose={vi.fn()} />);

    expect(screen.getByText("Success")).toBeInTheDocument();
  });

  it("renders the toast with status role", () => {
    render(
      <Toast
        id="1"
        title="Success"
        message="Invoice created."
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Toast
        id="invoice-1"
        title="Success"
        message="Invoice created."
        onClose={onClose}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Close notification",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith("invoice-1");
  });

  it("automatically closes after the duration", () => {
    vi.useFakeTimers();

    const onClose = vi.fn();

    render(
      <Toast
        id="invoice-1"
        title="Success"
        message="Invoice created."
        duration={3000}
        onClose={onClose}
      />,
    );

    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2999);

    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith("invoice-1");
  });

  it("does not automatically close when duration is zero", () => {
    vi.useFakeTimers();

    const onClose = vi.fn();

    render(
      <Toast
        id="invoice-1"
        title="Success"
        message="Invoice created."
        duration={0}
        onClose={onClose}
      />,
    );

    vi.advanceTimersByTime(10000);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not automatically close when duration is negative", () => {
    vi.useFakeTimers();

    const onClose = vi.fn();

    render(
      <Toast
        id="invoice-1"
        title="Success"
        message="Invoice created."
        duration={-1000}
        onClose={onClose}
      />,
    );

    vi.advanceTimersByTime(10000);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("uses the success variant styles", () => {
    render(
      <Toast id="1" title="Success" variant="success" onClose={vi.fn()} />,
    );

    const toast = screen.getByRole("status");

    expect(toast).toHaveClass("border-success/20");

    expect(toast.querySelector(".bg-success\\/10")).toBeInTheDocument();

    expect(toast.querySelector(".bg-success")).toBeInTheDocument();
  });

  it("uses the error variant styles", () => {
    render(<Toast id="1" title="Error" variant="error" onClose={vi.fn()} />);

    const toast = screen.getByRole("status");

    expect(toast).toHaveClass("border-error/20");

    expect(toast.querySelector(".bg-error\\/10")).toBeInTheDocument();

    expect(toast.querySelector(".bg-error")).toBeInTheDocument();
  });

  it("uses the warning variant styles", () => {
    render(
      <Toast id="1" title="Warning" variant="warning" onClose={vi.fn()} />,
    );

    const toast = screen.getByRole("status");

    expect(toast).toHaveClass("border-warning/20");

    expect(toast.querySelector(".bg-warning\\/10")).toBeInTheDocument();

    expect(toast.querySelector(".bg-warning")).toBeInTheDocument();
  });

  it("uses the info variant styles", () => {
    render(
      <Toast id="1" title="Information" variant="info" onClose={vi.fn()} />,
    );

    const toast = screen.getByRole("status");

    expect(toast).toHaveClass("border-primary/20");

    expect(toast.querySelector(".bg-primary\\/10")).toBeInTheDocument();

    expect(toast.querySelector(".bg-primary")).toBeInTheDocument();
  });

  it("uses info variant by default", () => {
    render(<Toast id="1" title="Information" onClose={vi.fn()} />);

    const toast = screen.getByRole("status");

    expect(toast).toHaveClass("border-primary/20");
  });

  it("renders the progress bar when duration is greater than zero", () => {
    render(
      <Toast id="1" title="Information" duration={5000} onClose={vi.fn()} />,
    );

    const progressBar = screen.getByRole("status").querySelector(".bg-primary");

    expect(progressBar).toBeInTheDocument();
  });

  it("does not render the progress bar when duration is zero", () => {
    render(<Toast id="1" title="Information" duration={0} onClose={vi.fn()} />);

    const progressBar = screen.getByRole("status").querySelector(".bg-primary");

    expect(progressBar).not.toBeInTheDocument();
  });

  it("sets the progress animation duration", () => {
    render(
      <Toast id="1" title="Information" duration={5000} onClose={vi.fn()} />,
    );

    const progressBar = screen.getByRole("status").querySelector(".bg-primary");

    expect(progressBar).toHaveStyle(
      "animation: toast-progress 5000ms linear forwards",
    );
  });

  it("renders the close notification button", () => {
    render(<Toast id="1" title="Information" onClose={vi.fn()} />);

    expect(
      screen.getByRole("button", {
        name: "Close notification",
      }),
    ).toBeInTheDocument();
  });
});
