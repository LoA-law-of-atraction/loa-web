"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
  const modalConfirmButtonRef = useRef(null);
  const modalIdRef = useRef(0);

  const addToast = (message, type = "success", duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showModal = (message, options = {}) => {
    return new Promise((resolve) => {
      const type = options.type || "info";
      const defaultTitle =
        type === "error"
          ? "Something went wrong"
          : type === "warning"
            ? "Please confirm"
            : type === "success"
              ? "Success"
              : "Notice";

      const nextId = ++modalIdRef.current;
      setModal({
        id: nextId,
        message,
        type,
        title: options.title || defaultTitle,
        confirmText: options.confirmText || "OK",
        cancelText: options.cancelText,
        onConfirm: () => {
          setModal(null);
          resolve(true);
        },
        onCancel: () => {
          setModal(null);
          resolve(false);
        },
      });
    });
  };

  const alert = (message, type = "info") => {
    return showModal(message, { type });
  };

  const confirm = (message, typeOrOptions = "warning", maybeOptions = {}) => {
    const type = typeof typeOrOptions === "string" ? typeOrOptions : "warning";
    const options =
      typeof typeOrOptions === "object" && typeOrOptions !== null
        ? typeOrOptions
        : maybeOptions || {};

    return showModal(message, {
      type,
      confirmText: options.confirmText || "Continue",
      cancelText: options.cancelText || "Cancel",
      title: options.title,
    });
  };

  // Modal UX: Escape to close, lock background scroll, and focus primary action
  useEffect(() => {
    if (!modal) return;

    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (modal.cancelText) modal.onCancel();
      else modal.onConfirm();
    };

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus primary action for keyboard users
    const t = setTimeout(() => {
      modalConfirmButtonRef.current?.focus?.();
    }, 0);

    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [modal]);

  return (
    <ToastContext.Provider value={{ addToast, showModal, alert, confirm }}>
      {children}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-md
              animate-slide-in backdrop-blur-sm
              ${
                toast.type === "success"
                  ? "bg-gray-900 text-white"
                  : toast.type === "error"
                    ? "bg-red-600 text-white"
                    : "bg-gray-800 text-white"
              }
            `}
          >
            <span className="text-lg">
              {toast.type === "success"
                ? "✓"
                : toast.type === "error"
                  ? "✕"
                  : "ℹ"}
            </span>
            <p className="flex-1 text-sm">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`toast-modal-title-${modal.id}`}
            aria-describedby={`toast-modal-desc-${modal.id}`}
            className="w-full max-w-lg my-8 rounded-2xl border border-gray-200 bg-white shadow-2xl animate-fade-in overflow-hidden dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-start gap-4">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                    modal.type === "error"
                      ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-900/60 dark:text-red-300"
                      : modal.type === "warning"
                        ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/60 dark:text-amber-200"
                        : modal.type === "success"
                          ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-900/60 dark:text-green-200"
                          : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/60 dark:text-blue-200"
                  }`}
                >
                  {modal.type === "success" ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : modal.type === "error" ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 9v4m0 4h.01M10.29 3.86l-7.4 12.8A2 2 0 004.62 20h14.76a2 2 0 001.73-3.34l-7.4-12.8a2 2 0 00-3.42 0z"
                      />
                    </svg>
                  ) : modal.type === "warning" ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 9v4m0 4h.01M10.29 3.86l-7.4 12.8A2 2 0 004.62 20h14.76a2 2 0 001.73-3.34l-7.4-12.8a2 2 0 00-3.42 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M13 16h-1v-4h-1m1-4h.01M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"
                      />
                    </svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3
                    id={`toast-modal-title-${modal.id}`}
                    className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100"
                  >
                    {modal.title}
                  </h3>
                  <p
                    id={`toast-modal-desc-${modal.id}`}
                    className="mt-1 text-sm text-gray-600 break-words overflow-wrap-anywhere dark:text-gray-300"
                  >
                    {modal.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    modal.cancelText ? modal.onCancel() : modal.onConfirm()
                  }
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
                  aria-label="Close dialog"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex gap-3 justify-end flex-wrap">
                {modal.cancelText && (
                  <button
                    type="button"
                    onClick={modal.onCancel}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200 font-medium transition dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                  >
                    {modal.cancelText}
                  </button>
                )}

                <button
                  type="button"
                  ref={modalConfirmButtonRef}
                  onClick={modal.onConfirm}
                  className={`px-4 py-2.5 rounded-xl font-medium transition shadow-sm hover:shadow ${
                    modal.type === "error"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : modal.type === "warning"
                        ? "bg-amber-600 text-white hover:bg-amber-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {modal.confirmText}
                </button>
              </div>

              <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                Press Esc to {modal.cancelText ? "cancel" : "close"}.
              </p>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
