import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import SidebarUser from "./SidebarUser";

const renderSidebarUser = (props = {}) => {
  return render(
    <MemoryRouter>
      <SidebarUser {...props} />
    </MemoryRouter>,
  );
};

describe("SidebarUser", () => {
  it("renders the collapsed user avatar", () => {
    renderSidebarUser({
      isCollapsed: true,
    });

    expect(screen.getByText("JR")).toBeInTheDocument();
  });

  it("renders default user information in expanded mode", () => {
    renderSidebarUser({
      isCollapsed: false,
    });

    expect(screen.getByText("J. Reynolds")).toBeInTheDocument();

    expect(screen.getByText("System Admin")).toBeInTheDocument();
  });

  it("renders custom user information in expanded mode", () => {
    renderSidebarUser({
      isCollapsed: false,
      userName: "Sarah Jenkins",
      userRole: "Fleet Director",
    });

    expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();

    expect(screen.getByText("Fleet Director")).toBeInTheDocument();
  });

  it("renders the user settings link in expanded mode", () => {
    renderSidebarUser({
      isCollapsed: false,
    });

    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("href", "/settings");

    expect(link).toHaveAttribute("title", "User Settings");
  });

  it("renders the user settings link in collapsed mode", () => {
    renderSidebarUser({
      isCollapsed: true,
    });

    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("href", "/settings");
  });

  it("shows the default user details in the collapsed link title", () => {
    renderSidebarUser({
      isCollapsed: true,
    });

    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("title", "J. Reynolds (System Admin)");
  });

  it("shows custom user details in the collapsed link title", () => {
    renderSidebarUser({
      isCollapsed: true,
      userName: "Sarah Jenkins",
      userRole: "Fleet Director",
    });

    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("title", "Sarah Jenkins (Fleet Director)");
  });

  it("renders the user settings title in expanded mode", () => {
    renderSidebarUser({
      isCollapsed: false,
    });

    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("title", "User Settings");
  });

  it("renders the avatar initials in collapsed mode", () => {
    renderSidebarUser({
      isCollapsed: true,
      userName: "Sarah Jenkins",
      userRole: "Fleet Director",
    });

    expect(screen.getByText("JR")).toBeInTheDocument();
  });

  it("does not render the full user information in collapsed mode", () => {
    renderSidebarUser({
      isCollapsed: true,
      userName: "Sarah Jenkins",
      userRole: "Fleet Director",
    });

    expect(screen.queryByText("Sarah Jenkins")).not.toBeInTheDocument();

    expect(screen.queryByText("FLEET DIRECTOR")).not.toBeInTheDocument();
  });

  it("renders the full user information in expanded mode", () => {
    renderSidebarUser({
      isCollapsed: false,
      userName: "Sarah Jenkins",
      userRole: "Fleet Director",
    });

    expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();

    expect(screen.getByText("Fleet Director")).toBeInTheDocument();
  });

  it("does not render the avatar initials separately in expanded mode", () => {
    renderSidebarUser({
      isCollapsed: false,
    });

    expect(screen.queryByText("JR")).not.toBeInTheDocument();
  });
});
