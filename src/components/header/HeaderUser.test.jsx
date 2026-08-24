import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import HeaderUser from "./HeaderUser";

const renderHeaderUser = (props = {}) => {
  return render(
    <MemoryRouter>
      <HeaderUser {...props} />
    </MemoryRouter>,
  );
};

describe("HeaderUser", () => {
  it("renders the default user name", () => {
    renderHeaderUser();

    expect(screen.getByText("Sarah Jenkins")).toBeInTheDocument();
  });

  it("renders the default user role", () => {
    renderHeaderUser();

    expect(screen.getByText("Fleet Director")).toBeInTheDocument();
  });

  it("renders custom user information", () => {
    renderHeaderUser({
      userName: "John Reynolds",
      userRole: "System Admin",
    });

    expect(screen.getByText("John Reynolds")).toBeInTheDocument();

    expect(screen.getByText("System Admin")).toBeInTheDocument();
  });

  it("renders the avatar with the user name as alt text", () => {
    renderHeaderUser();

    const avatar = screen.getByRole("img", {
      name: "Sarah Jenkins",
    });

    expect(avatar).toBeInTheDocument();
  });

  it("uses the provided avatar URL", () => {
    const avatarUrl = "https://example.com/avatar.jpg";

    renderHeaderUser({
      userName: "John Reynolds",
      avatarUrl,
    });

    const avatar = screen.getByRole("img", {
      name: "John Reynolds",
    });

    expect(avatar).toHaveAttribute("src", avatarUrl);
  });

  it("renders the profile link pointing to settings", () => {
    renderHeaderUser();

    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("href", "/settings");
  });

  it("renders the correct title for the default user", () => {
    renderHeaderUser();

    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("title", "Sarah Jenkins (Fleet Director)");
  });

  it("renders the correct title for a custom user", () => {
    renderHeaderUser({
      userName: "John Reynolds",
      userRole: "System Admin",
    });

    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("title", "John Reynolds (System Admin)");
  });

  it("renders the user initials fallback container", () => {
    const { container } = renderHeaderUser();

    const fallback = container.querySelector('div[style*="display: none"]');

    expect(fallback).toBeInTheDocument();

    expect(fallback).toHaveTextContent("SJ");
  });

  it("uses the first two initials for the default fallback", () => {
    const { container } = renderHeaderUser();

    const fallback = container.querySelector('div[style*="display: none"]');

    expect(fallback).toHaveTextContent("SJ");
  });

  it("does not display the fallback initially", () => {
    const { container } = renderHeaderUser();

    const fallback = container.querySelector('div[style*="display: none"]');

    expect(fallback).toHaveStyle({
      display: "none",
    });
  });

  it("renders the avatar image before a loading error", () => {
    renderHeaderUser();

    expect(
      screen.getByRole("img", {
        name: "Sarah Jenkins",
      }),
    ).toBeVisible();
  });

  it("shows the fallback avatar when the image fails to load", () => {
    const { container } = renderHeaderUser();

    const image = screen.getByRole("img", {
      name: "Sarah Jenkins",
    });

    const fallback = container.querySelector('div[style*="display: none"]');

    expect(fallback).toBeInTheDocument();

    fireEvent.error(image);

    expect(image.style.display).toBe("none");

    expect(fallback.style.display).toBe("flex");
  });

  it("handles image errors without throwing", () => {
    renderHeaderUser();

    const image = screen.getByRole("img", {
      name: "Sarah Jenkins",
    });

    expect(() => {
      fireEvent.error(image);
    }).not.toThrow();
  });

  it("supports a custom avatar fallback scenario", () => {
    const { container } = renderHeaderUser({
      userName: "Alex Morgan",
      userRole: "Operations Manager",
      avatarUrl: "https://example.com/avatar.jpg",
    });

    const image = screen.getByRole("img", {
      name: "Alex Morgan",
    });

    const fallback = container.querySelector('div[style*="display: none"]');

    expect(image).toHaveAttribute("alt", "Alex Morgan");

    fireEvent.error(image);

    expect(image.style.display).toBe("none");

    expect(fallback.style.display).toBe("flex");
  });

  it("renders the user name and role exactly as provided", () => {
    renderHeaderUser({
      userName: "A. B. Kumar",
      userRole: "Fleet Operations Lead",
    });

    expect(screen.getByText("A. B. Kumar")).toBeInTheDocument();

    expect(screen.getByText("Fleet Operations Lead")).toBeInTheDocument();
  });

  it("renders the profile as a single link", () => {
    renderHeaderUser();

    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
