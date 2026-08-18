import { useCallback, useMemo, useState } from "react";

import Toast from "../components/ui/Toast";
import ToastContext from "./ToastContext";

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, variant = "info", duration = 5000 }) => {
      const id = crypto.randomUUID();

      setToasts((current) => [
        ...current,
        {
          id,
          title,
          message,
          variant,
          duration,
        },
      ]);

      return id;
    },
    [],
  );

  const success = useCallback(
    (options) =>
      showToast({
        ...options,
        variant: "success",
      }),
    [showToast],
  );

  const error = useCallback(
    (options) =>
      showToast({
        ...options,
        variant: "error",
      }),
    [showToast],
  );

  const warning = useCallback(
    (options) =>
      showToast({
        ...options,
        variant: "warning",
      }),
    [showToast],
  );

  const info = useCallback(
    (options) =>
      showToast({
        ...options,
        variant: "info",
      }),
    [showToast],
  );

  const value = useMemo(
    () => ({
      showToast,
      success,
      error,
      warning,
      info,
      removeToast,
    }),
    [showToast, success, error, warning, info, removeToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className={[
          "pointer-events-none fixed right-4 top-4 z-[100]",
          "flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3",
          "sm:right-6 sm:top-6",
        ].join(" ")}
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onClose={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
