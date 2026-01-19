"use client";

import { useState, useEffect, createContext, useContext } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

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

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
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
