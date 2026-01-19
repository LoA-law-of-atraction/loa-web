"use client";

import { useRouter, usePathname } from "next/navigation";
import { ToastProvider } from "@/components/admin/Toast";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

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
                <nav className="hidden md:flex gap-1">
                  <a
                    href="/admin/blog"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === "/admin/blog"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Posts
                  </a>
                  <a
                    href="/admin/blog/new"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === "/admin/blog/new"
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    New Post
                  </a>
                </nav>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="/"
                  target="_blank"
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  View Site
                </a>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </div>
    </ToastProvider>
  );
}
