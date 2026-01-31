"use client";

import { useState, useEffect, createContext, useContext } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);

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
      setModal({
        message,
        type: options.type || "info",
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

  const confirm = (message) => {
    return showModal(message, {
      type: "warning",
      confirmText: "Continue",
      cancelText: "Cancel",
    });
  };

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full my-8 animate-fade-in">
            <div className="max-h-[80vh] overflow-y-auto overflow-x-hidden p-6">
              <div className="flex items-start gap-4 mb-6 min-w-0">
                <span className={`text-3xl flex-shrink-0 ${
                  modal.type === "error" ? "text-red-600" :
                  modal.type === "warning" ? "text-yellow-600" :
                  modal.type === "success" ? "text-green-600" :
                  "text-blue-600"
                }`}>
                  {modal.type === "error" ? "⚠️" :
                   modal.type === "warning" ? "⚠️" :
                   modal.type === "success" ? "✓" : "ℹ️"}
                </span>
                <p className="text-gray-900 flex-1 pt-1 break-words overflow-wrap-anywhere min-w-0">{modal.message}</p>
              </div>
              <div className="flex gap-3 justify-end flex-wrap">
                {modal.cancelText && (
                  <button
                    onClick={modal.onCancel}
                    className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium transition"
                  >
                    {modal.cancelText}
                  </button>
                )}
                <button
                  onClick={modal.onConfirm}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    modal.type === "error" || modal.type === "warning"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {modal.confirmText}
                </button>
              </div>
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
