import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";

import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext";

describe("App", () => {
  it("renders the application", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(screen.getAllByText("FleetCore").length).toBeGreaterThan(0);
  });
});
