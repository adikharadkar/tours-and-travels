import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import ThemeToggle from "./ThemeToggle";
import { ThemeProvider } from "../contexts/ThemeContext";

function renderThemeToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  it("renders the dark mode button initially", () => {
    renderThemeToggle();

    expect(
      screen.getByRole("button", {
        name: "Switch to dark mode",
      }),
    ).toBeInTheDocument();
  });

  it("switches to dark mode when clicked", async () => {
    const user = userEvent.setup();

    renderThemeToggle();

    await user.click(
      screen.getByRole("button", {
        name: "Switch to dark mode",
      }),
    );

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
  });
});
