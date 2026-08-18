import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Tooltip from "./Tooltip";

afterEach(() => {
  vi.useRealTimers();
});

describe("Tooltip", () => {
  it("renders the trigger", () => {
    render(
      <Tooltip content="Tooltip text">
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    expect(
      screen.getByRole("button", { name: "Hover me" }),
    ).toBeInTheDocument();
  });

  it("does not show the tooltip initially", () => {
    render(
      <Tooltip content="Tooltip text">
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows the tooltip after hovering", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Tooltip text" delay={300}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole("tooltip")).toHaveTextContent("Tooltip text");
  });

  it("does not show the tooltip before the delay", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Tooltip text" delay={500}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(499);
    });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByRole("tooltip")).toHaveTextContent("Tooltip text");
  });

  it("shows the tooltip after the configured delay", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Tooltip text" delay={300}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByRole("tooltip")).toHaveTextContent("Tooltip text");
  });

  it("hides the tooltip when the mouse leaves", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Tooltip text" delay={300}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.mouseLeave(trigger);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows the tooltip when the trigger receives focus", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Tooltip text" delay={300}>
        <button type="button">Focus me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Focus me",
    });

    fireEvent.focus(trigger);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole("tooltip")).toHaveTextContent("Tooltip text");
  });

  it("hides the tooltip when the trigger loses focus", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Tooltip text" delay={300}>
        <button type="button">Focus me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Focus me",
    });

    fireEvent.focus(trigger);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.blur(trigger);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("closes the tooltip when Escape is pressed", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Tooltip text" delay={300}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.keyDown(trigger, {
      key: "Escape",
    });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("sets aria-describedby when the tooltip is visible", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Tooltip text" delay={300}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    expect(trigger).not.toHaveAttribute("aria-describedby");

    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    const tooltip = screen.getByRole("tooltip");
    const tooltipId = tooltip.getAttribute("id");

    expect(tooltipId).toBeTruthy();

    expect(trigger).toHaveAttribute("aria-describedby", tooltipId);
  });

  it("removes aria-describedby when the tooltip is hidden", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Tooltip text" delay={300}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    const tooltip = screen.getByRole("tooltip");

    expect(trigger).toHaveAttribute(
      "aria-describedby",
      tooltip.getAttribute("id"),
    );

    fireEvent.mouseLeave(trigger);

    expect(trigger).not.toHaveAttribute("aria-describedby");
  });

  it("supports top placement by default", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Top tooltip" delay={300}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole("tooltip")).toHaveClass("bottom-full");
  });

  it("supports bottom placement", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Bottom tooltip" placement="bottom" delay={300}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole("tooltip")).toHaveClass("top-full");
  });

  it("supports left placement", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Left tooltip" placement="left" delay={300}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole("tooltip")).toHaveClass("right-full");
  });

  it("supports right placement", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Right tooltip" placement="right" delay={300}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole("tooltip")).toHaveClass("left-full");
  });

  it("falls back to top placement for an invalid placement", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Tooltip text" placement="invalid" delay={300}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole("tooltip")).toHaveClass("bottom-full");
  });

  it("does not show the tooltip when disabled", () => {
    render(
      <Tooltip content="Tooltip text" disabled>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("supports a custom delay", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Tooltip text" delay={1000}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(999);
    });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByRole("tooltip")).toHaveTextContent("Tooltip text");
  });

  it("applies custom className to the tooltip", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Tooltip text" className="custom-tooltip" delay={300}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole("tooltip")).toHaveClass("custom-tooltip");
  });

  it("renders no tooltip when content is missing", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="" delay={300}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("renders no tooltip when content is null", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content={null} delay={300}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("renders the tooltip arrow", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Tooltip text" delay={300}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    const tooltip = screen.getByRole("tooltip");

    const arrow = tooltip.querySelector('[aria-hidden="true"]');

    expect(arrow).toBeInTheDocument();
    expect(arrow).toHaveClass("border-4");
    expect(arrow).toHaveClass("border-foreground");
  });

  it("clears the pending timer when the mouse leaves before the delay", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Tooltip text" delay={500}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Hover me",
    });

    fireEvent.mouseEnter(trigger);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    fireEvent.mouseLeave(trigger);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("clears the pending timer when the trigger loses focus before the delay", () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Tooltip text" delay={500}>
        <button type="button">Focus me</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {
      name: "Focus me",
    });

    fireEvent.focus(trigger);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    fireEvent.blur(trigger);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
