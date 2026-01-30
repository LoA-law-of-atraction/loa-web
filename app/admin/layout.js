"use client";

import { useRouter, usePathname } from "next/navigation";
import { ToastProvider } from "@/components/admin/Toast";
import { useState } from "react";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <ToastProvider>
      <div className="min-h-screen bg-white">
        {/* Admin Header */}
        <header className="border-b border-gray-200 sticky top-0 z-50 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-8">
                <a
                  href="/admin/blog"
                  className="text-xl font-semibold text-gray-900"
                >
                  LoA Admin
                </a>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex gap-1">
                  <a
                    href="/admin/blog"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === "/admin/blog" || pathname === "/admin/blog/new"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Posts
                  </a>
                  <a
                    href="/admin/video-editor"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname.startsWith("/admin/video-editor")
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Video Editor
                  </a>
                  <a
                    href="/admin/video-generator"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname.startsWith("/admin/video-generator")
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Video Generator
                  </a>
                  <a
                    href="/admin/apis"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname.startsWith("/admin/apis")
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    APIs
                  </a>
                </nav>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-4">
                <a
                  href="/"
                  target="_blank"
                  className="hidden sm:block text-sm text-gray-500 hover:text-gray-900"
                >
                  View Site
                </a>
                <button
                  onClick={handleLogout}
                  className="hidden sm:block text-sm text-gray-500 hover:text-gray-900"
                >
                  Logout
                </button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-gray-600 hover:text-gray-900"
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
              <nav className="md:hidden py-4 border-t">
                <div className="flex flex-col gap-1">
                  <a
                    href="/admin/blog"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === "/admin/blog" || pathname === "/admin/blog/new"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Posts
                  </a>
                  <a
                    href="/admin/video-editor"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname.startsWith("/admin/video-editor")
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Video Editor
                  </a>
                  <a
                    href="/admin/video-generator"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname.startsWith("/admin/video-generator")
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Video Generator
                  </a>
                  <a
                    href="/admin/apis"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname.startsWith("/admin/apis")
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    APIs
                  </a>

                  {/* Mobile Actions */}
                  <div className="border-t mt-2 pt-2">
                    <a
                      href="/"
                      target="_blank"
                      className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      View Site
                    </a>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
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
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
