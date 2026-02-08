"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function AdminThemeToggle({ className = "" }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={
        "admin-icon-btn focus:outline-none focus:ring-2 focus:ring-blue-500/40 " +
        className
      }
      aria-label={
        mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Toggle theme"
      }
      title={
        mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Toggle theme"
      }
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
