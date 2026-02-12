import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

function ToastItem({ toast, onDismiss }) {
  const styles = {
    success: "border-green-200 bg-green-50 text-green-900",
    error: "border-red-200 bg-red-50 text-red-900",
    info: "border-gray-200 bg-white text-gray-900",
  };
  const hasActions = Array.isArray(toast.actions) && toast.actions.length > 0;

  return (
    <div
      className={[
        "pointer-events-auto w-full rounded-xl border px-4 py-3 text-sm shadow-sm",
        styles[toast.type] || styles.info,
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 break-words">{toast.message}</p>
        {!hasActions ? (
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 text-xs font-semibold opacity-70 hover:opacity-100"
            aria-label="Dismiss notification"
          >
            Dismiss
          </button>
        ) : null}
      </div>
      {hasActions ? (
        <div className="mt-3 flex justify-end gap-2">
          {toast.actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-semibold",
                action.variant === "danger"
                  ? "bg-red-600 text-white"
                  : "bg-white text-gray-800 ring-1 ring-gray-300",
              ].join(" ")}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast, durationMs = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((current) => [...current, { id, ...toast }]);

      if (durationMs > 0) {
        const timer = window.setTimeout(() => {
          dismissToast(id);
        }, durationMs);

        timersRef.current.set(id, timer);
      }
      return id;
    },
    [dismissToast],
  );

  const api = useMemo(
    () => ({
      show: (message, options = {}) =>
        pushToast(
          {
            message,
            type: options.type || "info",
            actions: options.actions || [],
          },
          options.durationMs || 3500,
        ),
      success: (message, options = {}) =>
        pushToast(
          {
            message,
            type: "success",
            actions: options.actions || [],
          },
          options.durationMs || 3500,
        ),
      error: (message, options = {}) =>
        pushToast(
          {
            message,
            type: "error",
            actions: options.actions || [],
          },
          options.durationMs || 4500,
        ),
      confirm: (message, options = {}) =>
        new Promise((resolve) => {
          let toastId = "";
          const cancelLabel = options.cancelLabel || "Cancel";
          const confirmLabel = options.confirmLabel || "Confirm";

          const onCancel = () => {
            dismissToast(toastId);
            resolve(false);
          };

          const onConfirm = () => {
            dismissToast(toastId);
            resolve(true);
          };

          toastId = pushToast(
            {
              message,
              type: options.type || "error",
              actions: [
                { label: cancelLabel, variant: "secondary", onClick: onCancel },
                { label: confirmLabel, variant: "danger", onClick: onConfirm },
              ],
            },
            0,
          );
        }),
      dismiss: dismissToast,
    }),
    [dismissToast, pushToast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] px-3 sm:top-4">
        <div className="mx-auto flex w-full max-w-md flex-col gap-2">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
