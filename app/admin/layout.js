"use client";

import { useRouter, usePathname } from "next/navigation";
import { ToastProvider } from "@/components/admin/Toast";
import { useState, useEffect, useRef } from "react";
import { ThemeProvider } from "next-themes";
import AdminThemeToggle from "@/components/admin/AdminThemeToggle";
import { ChevronDown } from "lucide-react";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(null); // 'video' | 'more' | null
  const desktopNavRef = useRef(null);

  const postsItem = {
    href: "/admin/blog",
    label: "Posts",
    match: (p) => p === "/admin/blog" || p.startsWith("/admin/blog/"),
  };

  const apisItem = {
    href: "/admin/apis",
    label: "APIs",
    match: (p) => p.startsWith("/admin/apis"),
  };

  const setupItem = {
    href: "/admin/setup",
    label: "Setup",
    match: (p) => p.startsWith("/admin/setup"),
  };

  const videoStudioItems = [
    {
      href: "/admin/video-generator",
      label: "Video Generator",
      match: (p) => p.startsWith("/admin/video-generator"),
    },
    {
      href: "/admin/video-editor",
      label: "Video Editor",
      match: (p) => p.startsWith("/admin/video-editor"),
    },
    {
      href: "/admin/projects",
      label: "Projects",
      match: (p) => p.startsWith("/admin/projects"),
    },
    {
      href: "/admin/characters",
      label: "Characters",
      match: (p) => p.startsWith("/admin/characters"),
    },
    {
      href: "/admin/locations",
      label: "Locations",
      match: (p) => p.startsWith("/admin/locations"),
    },
    {
      href: "/admin/actions",
      label: "Actions",
      match: (p) => p.startsWith("/admin/actions"),
    },
    {
      href: "/admin/topics",
      label: "Topics",
      match: (p) => p.startsWith("/admin/topics"),
    },
    {
      href: "/admin/categories",
      label: "Categories",
      match: (p) => p.startsWith("/admin/categories"),
    },
    {
      href: "/admin/budget",
      label: "Budget",
      match: (p) => p.startsWith("/admin/budget"),
    },
  ];

  const isVideoStudioActive = videoStudioItems.some((i) => i.match(pathname));

  const navLinkClass = (active) =>
    "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap " +
    (active
      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800");

  const dropdownButtonClass = (active) =>
    "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap " +
    (active
      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800");

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setDesktopMenuOpen(null);
  }, [pathname]);

  // Close desktop dropdowns when clicking outside
  useEffect(() => {
    if (!desktopMenuOpen) return;

    const onMouseDown = (e) => {
      if (!desktopNavRef.current) return;
      if (desktopNavRef.current.contains(e.target)) return;
      setDesktopMenuOpen(null);
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [desktopMenuOpen]);

  // Don't show admin layout on login page
  if (pathname === "/admin/login") {
    return children;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ToastProvider>
        <div className="admin min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900 dark:from-gray-950 dark:to-gray-950 dark:text-gray-100">
          {/* Admin Header */}
          <header className="border-b border-gray-200 sticky top-0 z-50 bg-white/80 backdrop-blur dark:bg-gray-900/70 dark:border-gray-800 shadow-sm">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-8">
                  <a
                    href="/admin/blog"
                    className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100"
                  >
                    LoA Admin
                  </a>

                  {/* Desktop Navigation */}
                  <nav
                    ref={desktopNavRef}
                    className="hidden md:flex gap-1 items-center relative"
                  >
                    <a
                      href={postsItem.href}
                      className={navLinkClass(postsItem.match(pathname))}
                    >
                      {postsItem.label}
                    </a>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setDesktopMenuOpen((v) =>
                            v === "video" ? null : "video",
                          )
                        }
                        className={dropdownButtonClass(
                          isVideoStudioActive || desktopMenuOpen === "video",
                        )}
                        aria-haspopup="menu"
                        aria-expanded={desktopMenuOpen === "video"}
                      >
                        Video Studio
                        <ChevronDown size={16} className="opacity-80" />
                      </button>

                      {desktopMenuOpen === "video" && (
                        <div
                          role="menu"
                          className="absolute left-0 top-full mt-2 w-64 admin-card-solid p-2 shadow-lg"
                        >
                          {videoStudioItems.map((item) => {
                            const active = item.match(pathname);
                            return (
                              <a
                                key={item.href}
                                href={item.href}
                                onClick={() => setDesktopMenuOpen(null)}
                                className={
                                  "block px-3 py-2 rounded-xl text-sm font-medium transition-colors " +
                                  (active
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800")
                                }
                              >
                                {item.label}
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <a
                      href={apisItem.href}
                      className={navLinkClass(apisItem.match(pathname))}
                    >
                      {apisItem.label}
                    </a>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setDesktopMenuOpen((v) =>
                            v === "more" ? null : "more",
                          )
                        }
                        className={dropdownButtonClass(
                          setupItem.match(pathname) ||
                            desktopMenuOpen === "more",
                        )}
                        aria-haspopup="menu"
                        aria-expanded={desktopMenuOpen === "more"}
                      >
                        More
                        <ChevronDown size={16} className="opacity-80" />
                      </button>

                      {desktopMenuOpen === "more" && (
                        <div
                          role="menu"
                          className="absolute left-0 top-full mt-2 w-48 admin-card-solid p-2 shadow-lg"
                        >
                          <a
                            href={setupItem.href}
                            onClick={() => setDesktopMenuOpen(null)}
                            className={
                              "block px-3 py-2 rounded-xl text-sm font-medium transition-colors " +
                              (setupItem.match(pathname)
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800")
                            }
                          >
                            {setupItem.label}
                          </a>
                        </div>
                      )}
                    </div>
                  </nav>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                  <AdminThemeToggle className="hidden sm:inline-flex" />
                  <a
                    href="/"
                    target="_blank"
                    className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    View Site
                  </a>
                  <button
                    onClick={handleLogout}
                    className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  >
                    Logout
                  </button>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    aria-label="Toggle menu"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {mobileMenuOpen ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h16"
                        />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {/* Mobile Navigation */}
              {mobileMenuOpen && (
                <nav className="md:hidden py-4 border-t dark:border-gray-800">
                  <div className="flex flex-col gap-1">
                    <a
                      href={postsItem.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={
                        "px-3 py-2 rounded-xl text-sm font-medium transition-colors " +
                        (postsItem.match(pathname)
                          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800")
                      }
                    >
                      {postsItem.label}
                    </a>

                    <div className="mt-2 px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Video Studio
                    </div>
                    {videoStudioItems.map((item) => {
                      const active = item.match(pathname);
                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={
                            "ml-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors " +
                            (active
                              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800")
                          }
                        >
                          {item.label}
                        </a>
                      );
                    })}

                    <a
                      href={apisItem.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={
                        "mt-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors " +
                        (apisItem.match(pathname)
                          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800")
                      }
                    >
                      {apisItem.label}
                    </a>

                    <div className="mt-2 px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      System
                    </div>
                    <a
                      href={setupItem.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={
                        "ml-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors " +
                        (setupItem.match(pathname)
                          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800")
                      }
                    >
                      {setupItem.label}
                    </a>

                    {/* Mobile Actions */}
                    <div className="border-t mt-2 pt-2">
                      <div className="px-3 py-2">
                        <AdminThemeToggle className="inline-flex" />
                      </div>
                      <a
                        href="/"
                        target="_blank"
                        className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      >
                        View Site
                      </a>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </nav>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
