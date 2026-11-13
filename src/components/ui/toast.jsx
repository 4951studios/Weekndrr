import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const dismiss = useCallback(() => setToast(null), []);

  const show = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    setToast({ id, message, ...options });
    window.setTimeout(
      () => setToast((current) => (current?.id === id ? null : current)),
      options.duration ?? 4000
    );
  }, []);

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-nav-safe z-50 flex justify-center px-4 pb-3"
      >
        {toast && (
          <div
            role={toast.tone === "error" ? "alert" : "status"}
            className={
              "pointer-events-auto flex max-w-md items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg " +
              (toast.tone === "error" ? "bg-rose-600" : "bg-slate-900")
            }
          >
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action.onClick();
                  dismiss();
                }}
                className="font-semibold underline underline-offset-2"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
