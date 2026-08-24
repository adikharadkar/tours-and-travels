import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import HeaderThemeToggle from "./HeaderThemeToggle";

import { useTheme } from "../../contexts/useTheme";

vi.mock("../../contexts/useTheme", () => ({
  useTheme: vi.fn(),
}));

describe("HeaderThemeToggle", () => {
  const toggleTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useTheme.mockReturnValue({
      theme: "light",
      toggleTheme,
    });
  });

  it("renders the light mode icon when the current theme is light", () => {
    render(<HeaderThemeToggle />);

    expect(screen.getByText("light_mode")).toBeInTheDocument();
  });

  it("renders the dark mode icon when the current theme is dark", () => {
    useTheme.mockReturnValue({
      theme: "dark",
      toggleTheme,
    });

    render(<HeaderThemeToggle />);

    expect(screen.getByText("dark_mode")).toBeInTheDocument();
  });

  it("has the correct accessible label in light mode", () => {
    render(<HeaderThemeToggle />);

    expect(
      screen.getByRole("button", {
        name: "Switch to dark mode",
      }),
    ).toBeInTheDocument();
  });

  it("has the correct accessible label in dark mode", () => {
    useTheme.mockReturnValue({
      theme: "dark",
      toggleTheme,
    });

    render(<HeaderThemeToggle />);

    expect(
      screen.getByRole("button", {
        name: "Switch to light mode",
      }),
    ).toBeInTheDocument();
  });

  it("sets the correct title in light mode", () => {
    render(<HeaderThemeToggle />);

    expect(
      screen.getByRole("button", {
        name: "Switch to dark mode",
      }),
    ).toHaveAttribute("title", "Switch to dark mode");
  });

  it("sets the correct title in dark mode", () => {
    useTheme.mockReturnValue({
      theme: "dark",
      toggleTheme,
    });

    render(<HeaderThemeToggle />);

    expect(
      screen.getByRole("button", {
        name: "Switch to light mode",
      }),
    ).toHaveAttribute("title", "Switch to light mode");
  });

  it("calls toggleTheme when the button is clicked", () => {
    render(<HeaderThemeToggle />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Switch to dark mode",
      }),
    );

    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });

  it("calls toggleTheme only once for a single click", () => {
    render(<HeaderThemeToggle />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Switch to dark mode",
      }),
    );

    expect(toggleTheme).toHaveBeenCalledTimes(1);
  });

  it("uses the theme returned by useTheme", () => {
    useTheme.mockReturnValue({
      theme: "dark",
      toggleTheme,
    });

    render(<HeaderThemeToggle />);

    expect(useTheme).toHaveBeenCalledTimes(1);

    expect(screen.getByText("dark_mode")).toBeInTheDocument();
  });

  it("marks the theme icon as filled", () => {
    render(<HeaderThemeToggle />);

    const icon = screen.getByText("light_mode");

    expect(icon).toHaveAttribute("data-weight", "fill");
  });
});
