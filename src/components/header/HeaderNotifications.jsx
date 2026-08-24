import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getLiveNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/notificationService";

export default function HeaderNotifications() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const containerRef = useRef(null);

  // Load live notifications
  const reloadNotifications = () => {
    const data = getLiveNotifications();
    setNotifications(data);
  };

  useEffect(() => {
    reloadNotifications();
    // Poll notifications periodically to reflect trip/driver updates
    const interval = setInterval(reloadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    markAllNotificationsRead(notifications);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (notif) => {
    markNotificationRead(notif.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
    );
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Notification Bell Button */}
      <button
        type="button"
        id="notif-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        title="Notifications"
        className={[
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer relative",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b38d4] dark:focus-visible:ring-[#d0bcff]",
          isOpen
            ? "bg-[#eaedff] text-[#6b38d4] dark:bg-[#33343b]/70 dark:text-[#d0bcff]"
            : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#6b38d4] dark:text-[#e2e2eb] dark:hover:bg-[#33343b]/50",
        ].join(" ")}
      >
        <span className="material-symbols-outlined text-[20px]">
          notifications
        </span>

        {/* Unread Badge Indicator */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-[#ba1a1a] text-[10px] font-bold text-white shadow-xs border border-white dark:border-[#191b22]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Popover */}
      {isOpen && (
        <div
          role="region"
          aria-label="Notifications panel"
          className={[
            "absolute right-0 top-[calc(100%+8px)] w-80 sm:w-96 rounded-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col",
            // Surfaces & Shadows per Stitch specification
            "bg-white border border-[#e2e8f0] shadow-[0_10px_25px_-5px_rgba(15,23,42,0.12)]",
            "dark:bg-[#262a36] dark:border-white/10 dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)]",
          ].join(" ")}
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0]/80 dark:border-white/10 bg-[#f8fafc]/70 dark:bg-[#33343b]/20">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#0f172a] dark:text-[#e2e2eb]">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#ffdad6] dark:bg-[#93000a]/40 text-[#ba1a1a] dark:text-[#ffb4ab] text-[11px] font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-[#6b38d4] dark:text-[#d0bcff] hover:underline font-medium cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Scrollable Notification List */}
          <div className="max-h-[320px] overflow-y-auto divide-y divide-[#e2e8f0]/50 dark:divide-white/5">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={[
                    "p-3.5 sm:p-4 hover:bg-[#f1f5f9] dark:hover:bg-[#33343b]/40 transition-colors cursor-pointer group flex gap-3 relative",
                    !item.isRead ? "bg-[#f8fafc]/40 dark:bg-[#1a1d26]/40" : "",
                  ].join(" ")}
                >
                  {/* Left Active/Unread Indicator */}
                  {!item.isRead && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#6b38d4] dark:bg-[#d0bcff] rounded-r-full" />
                  )}

                  {/* Icon Circle */}
                  <div
                    className={[
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      item.badgeColor === "error"
                        ? "bg-[#ffdad6] text-[#ba1a1a] dark:bg-[#93000a]/30 dark:text-[#ffb4ab]"
                        : item.badgeColor === "warning"
                          ? "bg-[#fef3c7] text-[#d97706] dark:bg-[#d97706]/20 dark:text-[#fbbf24]"
                          : "bg-[#eaedff] text-[#6b38d4] dark:bg-[#6b38d4]/20 dark:text-[#d0bcff]",
                    ].join(" ")}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {item.icon || "info"}
                    </span>
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs sm:text-[13px] font-semibold text-[#0f172a] dark:text-[#e2e2eb] leading-tight">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-[#64748b] dark:text-[#cbc3d7]/60 shrink-0 mt-0.5 whitespace-nowrap">
                        {item.timeAgo}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748b] dark:text-[#cbc3d7]/80 leading-snug">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#64748b] dark:text-[#cbc3d7]/60">
                No notifications right now
              </div>
            )}
          </div>

          {/* Popover Footer */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              navigate("/trips");
            }}
            className="block w-full py-2.5 text-center text-xs font-semibold text-[#6b38d4] dark:text-[#d0bcff] hover:bg-[#f1f5f9] dark:hover:bg-[#33343b]/40 transition-colors bg-[#f8fafc]/50 dark:bg-[#33343b]/10 border-t border-[#e2e8f0]/80 dark:border-white/10 cursor-pointer"
          >
            View All Activity
          </button>
        </div>
      )}
    </div>
  );
}
