import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";

function renderTabs(props = {}) {
  return render(
    <Tabs defaultValue="overview" {...props}>
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>

        <TabsTrigger value="invoices">Invoices</TabsTrigger>

        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">Overview content</TabsContent>

      <TabsContent value="invoices">Invoice content</TabsContent>

      <TabsContent value="settings">Settings content</TabsContent>
    </Tabs>,
  );
}

describe("Tabs", () => {
  it("renders the tab list", () => {
    renderTabs();

    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("renders all tab triggers", () => {
    renderTabs();

    expect(
      screen.getByRole("tab", {
        name: "Overview",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("tab", {
        name: "Invoices",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("tab", {
        name: "Settings",
      }),
    ).toBeInTheDocument();
  });

  it("shows the default tab content", () => {
    renderTabs();

    expect(screen.getByText("Overview content")).toBeVisible();

    expect(screen.queryByText("Invoice content")).not.toBeInTheDocument();

    expect(screen.queryByText("Settings content")).not.toBeInTheDocument();
  });

  it("changes the active tab when clicked", async () => {
    const user = userEvent.setup();

    renderTabs();

    await user.click(
      screen.getByRole("tab", {
        name: "Invoices",
      }),
    );

    expect(screen.getByText("Invoice content")).toBeVisible();

    expect(screen.queryByText("Overview content")).not.toBeInTheDocument();
  });

  it("marks the active tab with aria-selected", () => {
    renderTabs();

    expect(
      screen.getByRole("tab", {
        name: "Overview",
      }),
    ).toHaveAttribute("aria-selected", "true");

    expect(
      screen.getByRole("tab", {
        name: "Invoices",
      }),
    ).toHaveAttribute("aria-selected", "false");
  });

  it("calls onValueChange when a tab is selected", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    renderTabs({
      onValueChange,
    });

    await user.click(
      screen.getByRole("tab", {
        name: "Invoices",
      }),
    );

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("invoices");
  });

  it("supports controlled usage", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    renderTabs({
      value: "overview",
      onValueChange,
    });

    expect(screen.getByText("Overview content")).toBeVisible();

    await user.click(
      screen.getByRole("tab", {
        name: "Invoices",
      }),
    );

    expect(onValueChange).toHaveBeenCalledWith("invoices");

    expect(screen.getByText("Overview content")).toBeVisible();
  });

  it("supports disabled tabs", async () => {
    const user = userEvent.setup();

    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>

          <TabsTrigger value="settings" disabled>
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">Overview content</TabsContent>

        <TabsContent value="settings">Settings content</TabsContent>
      </Tabs>,
    );

    const settingsTab = screen.getByRole("tab", {
      name: "Settings",
    });

    expect(settingsTab).toBeDisabled();

    await user.click(settingsTab);

    expect(screen.getByText("Overview content")).toBeVisible();
  });

  it("renders tab panel accessibility attributes", () => {
    renderTabs();

    const tab = screen.getByRole("tab", {
      name: "Overview",
    });

    const panel = screen.getByRole("tabpanel");

    expect(tab).toHaveAttribute("aria-controls", panel.id);

    expect(panel).toHaveAttribute("aria-labelledby", tab.id);
  });

  it("supports forceMount", () => {
    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>

          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">Overview content</TabsContent>

        <TabsContent value="settings" forceMount>
          Settings content
        </TabsContent>
      </Tabs>,
    );

    expect(screen.getByText("Settings content")).toBeInTheDocument();

    expect(
      screen.getByText("Settings content").closest('[role="tabpanel"]'),
    ).toHaveAttribute("hidden");
  });

  it("applies custom className to Tabs", () => {
    renderTabs({
      className: "custom-tabs",
    });

    expect(screen.getByRole("tablist").parentElement).toHaveClass(
      "custom-tabs",
    );
  });
});
