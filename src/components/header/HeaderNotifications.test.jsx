import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import HeaderNotifications from "./HeaderNotifications";

import {
  getLiveNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notificationService";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../services/notificationService", () => ({
  getLiveNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

const notifications = [
  {
    id: "notif-1",
    title: "License Expiring",
    description: "Rajesh Patil's commercial driver license expires in 3 days.",
    timeAgo: "10 mins ago",
    icon: "warning",
    badgeColor: "warning",
    isRead: false,
    link: "/drivers/driver-1",
  },
  {
    id: "notif-2",
    title: "Trip Starting Soon",
    description: "TRP-0025 is scheduled to depart in 45 minutes.",
    timeAgo: "1 hour ago",
    icon: "route",
    badgeColor: "primary",
    isRead: true,
    link: "/trips/trip-25",
  },
  {
    id: "notif-3",
    title: "Invoice Overdue",
    description: "INV-1064 has an outstanding balance.",
    timeAgo: "2 hours ago",
    icon: "receipt_long",
    badgeColor: "error",
    isRead: false,
    link: "/invoices/inv-1064",
  },
];

const renderNotifications = () => {
  return render(
    <MemoryRouter>
      <HeaderNotifications />
    </MemoryRouter>,
  );
};

describe("HeaderNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getLiveNotifications.mockReturnValue(notifications);

    markAllNotificationsRead.mockImplementation(() => undefined);

    markNotificationRead.mockImplementation(() => undefined);
  });

  it("renders the notification button", () => {
    renderNotifications();

    expect(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    ).toBeInTheDocument();
  });

  it("loads live notifications on mount", () => {
    renderNotifications();

    expect(getLiveNotifications).toHaveBeenCalledTimes(1);
  });

  it("renders the correct unread count", () => {
    renderNotifications();

    /*
     * Two notifications are unread.
     */
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("does not render an unread badge when there are no unread notifications", () => {
    getLiveNotifications.mockReturnValue(
      notifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    );

    renderNotifications();

    const button = screen.getByRole("button", {
      name: "Notifications",
    });

    expect(
      button.querySelector(".absolute.top-1\\.5.right-1\\.5"),
    ).not.toBeInTheDocument();
  });

  it("starts with the notification panel closed", () => {
    renderNotifications();

    expect(
      screen.queryByRole("region", {
        name: "Notifications panel",
      }),
    ).not.toBeInTheDocument();
  });

  it("opens the notification panel when the bell is clicked", () => {
    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    expect(
      screen.getByRole("region", {
        name: "Notifications panel",
      }),
    ).toBeInTheDocument();
  });

  it("updates aria-expanded when the panel opens", () => {
    renderNotifications();

    const button = screen.getByRole("button", {
      name: "Notifications",
    });

    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the panel when the bell is clicked again", () => {
    renderNotifications();

    const button = screen.getByRole("button", {
      name: "Notifications",
    });

    fireEvent.click(button);

    expect(
      screen.getByRole("region", {
        name: "Notifications panel",
      }),
    ).toBeInTheDocument();

    fireEvent.click(button);

    expect(
      screen.queryByRole("region", {
        name: "Notifications panel",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders the notification heading", () => {
    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    expect(
      screen.getByRole("heading", {
        name: "Notifications",
      }),
    ).toBeInTheDocument();
  });

  it("renders the unread count in the panel header", () => {
    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    expect(screen.getByText("2 new")).toBeInTheDocument();
  });

  it("renders all notification titles", () => {
    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    expect(screen.getByText("License Expiring")).toBeInTheDocument();

    expect(screen.getByText("Trip Starting Soon")).toBeInTheDocument();

    expect(screen.getByText("Invoice Overdue")).toBeInTheDocument();
  });

  it("renders notification descriptions", () => {
    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    expect(
      screen.getByText(
        /Rajesh Patil's commercial driver license expires in 3 days/i,
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/TRP-0025 is scheduled to depart in 45 minutes/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/INV-1064 has an outstanding balance/i),
    ).toBeInTheDocument();
  });

  it("renders notification timestamps", () => {
    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    expect(screen.getByText("10 mins ago")).toBeInTheDocument();

    expect(screen.getByText("1 hour ago")).toBeInTheDocument();

    expect(screen.getByText("2 hours ago")).toBeInTheDocument();
  });

  it("renders the Mark all read action when unread notifications exist", () => {
    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    expect(
      screen.getByRole("button", {
        name: "Mark all read",
      }),
    ).toBeInTheDocument();
  });

  it("does not render Mark all read when all notifications are read", () => {
    getLiveNotifications.mockReturnValue(
      notifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    );

    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    expect(
      screen.queryByRole("button", {
        name: "Mark all read",
      }),
    ).not.toBeInTheDocument();
  });

  it("marks all notifications as read", async () => {
    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Mark all read",
      }),
    );

    expect(markAllNotificationsRead).toHaveBeenCalledTimes(1);

    expect(markAllNotificationsRead).toHaveBeenCalledWith(notifications);

    await waitFor(() => {
      expect(
        screen.queryByRole("button", {
          name: "Mark all read",
        }),
      ).not.toBeInTheDocument();
    });
  });

  it("marks a notification as read when it is clicked", () => {
    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    fireEvent.click(screen.getByText("License Expiring"));

    expect(markNotificationRead).toHaveBeenCalledTimes(1);

    expect(markNotificationRead).toHaveBeenCalledWith("notif-1");
  });

  it("navigates to the notification link when a notification has a link", () => {
    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    fireEvent.click(screen.getByText("License Expiring"));

    expect(navigateMock).toHaveBeenCalledTimes(1);

    expect(navigateMock).toHaveBeenCalledWith("/drivers/driver-1");
  });

  it("does not navigate when a notification has no link", () => {
    const notificationWithoutLink = {
      ...notifications[0],
      link: undefined,
    };

    getLiveNotifications.mockReturnValue([notificationWithoutLink]);

    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    fireEvent.click(screen.getByText("License Expiring"));

    expect(markNotificationRead).toHaveBeenCalledWith("notif-1");

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("closes the panel after a notification is clicked", () => {
    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    expect(
      screen.getByRole("region", {
        name: "Notifications panel",
      }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("License Expiring"));

    expect(
      screen.queryByRole("region", {
        name: "Notifications panel",
      }),
    ).not.toBeInTheDocument();
  });

  it("closes the panel when Escape is pressed", () => {
    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    expect(
      screen.getByRole("region", {
        name: "Notifications panel",
      }),
    ).toBeInTheDocument();

    fireEvent.keyDown(document, {
      key: "Escape",
    });

    expect(
      screen.queryByRole("region", {
        name: "Notifications panel",
      }),
    ).not.toBeInTheDocument();
  });

  it("closes the panel when clicking outside", () => {
    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    expect(
      screen.getByRole("region", {
        name: "Notifications panel",
      }),
    ).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(
      screen.queryByRole("region", {
        name: "Notifications panel",
      }),
    ).not.toBeInTheDocument();
  });

  it("does not close the panel when clicking inside the panel", () => {
    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    const panel = screen.getByRole("region", {
      name: "Notifications panel",
    });

    fireEvent.mouseDown(panel);

    expect(
      screen.getByRole("region", {
        name: "Notifications panel",
      }),
    ).toBeInTheDocument();
  });

  it("shows an empty state when there are no notifications", () => {
    getLiveNotifications.mockReturnValue([]);

    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    expect(screen.getByText("No notifications right now")).toBeInTheDocument();
  });

  it("does not render the unread count when there are no notifications", () => {
    getLiveNotifications.mockReturnValue([]);

    renderNotifications();

    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("renders the View All Activity action", () => {
    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    expect(
      screen.getByRole("button", {
        name: "View All Activity",
      }),
    ).toBeInTheDocument();
  });

  it("navigates to trips when View All Activity is clicked", () => {
    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "View All Activity",
      }),
    );

    expect(navigateMock).toHaveBeenCalledTimes(1);

    expect(navigateMock).toHaveBeenCalledWith("/trips");
  });

  it("closes the panel when View All Activity is clicked", () => {
    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "View All Activity",
      }),
    );

    expect(
      screen.queryByRole("region", {
        name: "Notifications panel",
      }),
    ).not.toBeInTheDocument();
  });

  it("supports notifications with no icon", () => {
    getLiveNotifications.mockReturnValue([
      {
        ...notifications[0],
        icon: undefined,
      },
    ]);

    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    expect(screen.getByText("info")).toBeInTheDocument();
  });

  it("supports error notification styling", () => {
    getLiveNotifications.mockReturnValue([
      {
        ...notifications[2],
      },
    ]);

    renderNotifications();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Notifications",
      }),
    );

    expect(screen.getByText("Invoice Overdue")).toBeInTheDocument();

    expect(screen.getByText("receipt_long")).toBeInTheDocument();
  });

  it("reloads notifications when the polling interval fires", () => {
    vi.useFakeTimers();

    try {
      renderNotifications();

      expect(getLiveNotifications).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(30000);

      expect(getLiveNotifications).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("cleans up the polling interval on unmount", () => {
    vi.useFakeTimers();

    try {
      const { unmount } = renderNotifications();

      expect(getLiveNotifications).toHaveBeenCalledTimes(1);

      unmount();

      vi.advanceTimersByTime(30000);

      expect(getLiveNotifications).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("accepts a notification with an unread state of false", () => {
    getLiveNotifications.mockReturnValue([
      {
        ...notifications[0],
        isRead: false,
      },
    ]);

    renderNotifications();

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("does not count read notifications as unread", () => {
    getLiveNotifications.mockReturnValue([
      {
        ...notifications[0],
        isRead: true,
      },
      {
        ...notifications[1],
        isRead: true,
      },
    ]);

    renderNotifications();

    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });
});
