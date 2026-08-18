import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Pagination from "./Pagination";

describe("Pagination", () => {
  it("does not render when there is only one page", () => {
    render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />,
    );

    expect(
      screen.queryByRole("navigation", {
        name: "Pagination",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders pagination navigation", () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />,
    );

    expect(
      screen.getByRole("navigation", {
        name: "Pagination",
      }),
    ).toBeInTheDocument();
  });

  it("renders all pages when there are few pages", () => {
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />,
    );

    for (let page = 1; page <= 5; page += 1) {
      expect(
        screen.getByRole("button", {
          name: `Go to page ${page}`,
        }),
      ).toBeInTheDocument();
    }
  });

  it("marks the current page", () => {
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} />,
    );

    expect(
      screen.getByRole("button", {
        name: "Go to page 2",
      }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("calls onPageChange when a page is clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Go to page 3",
      }),
    );

    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("goes to the next page", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Go to next page",
      }),
    );

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("goes to the previous page", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Go to previous page",
      }),
    );

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("disables previous on the first page", () => {
    render(
      <Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />,
    );

    expect(
      screen.getByRole("button", {
        name: "Go to previous page",
      }),
    ).toBeDisabled();
  });

  it("disables next on the last page", () => {
    render(
      <Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />,
    );

    expect(
      screen.getByRole("button", {
        name: "Go to next page",
      }),
    ).toBeDisabled();
  });

  it("does not change to the current page", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Go to page 2",
      }),
    );

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("shows ellipsis for many pages", () => {
    render(
      <Pagination currentPage={5} totalPages={20} onPageChange={vi.fn()} />,
    );

    expect(screen.getAllByText("...")).toHaveLength(2);
  });

  it("applies custom className", () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={vi.fn()}
        className="custom-pagination"
      />,
    );

    expect(
      screen.getByRole("navigation", {
        name: "Pagination",
      }),
    ).toHaveClass("custom-pagination");
  });
});
