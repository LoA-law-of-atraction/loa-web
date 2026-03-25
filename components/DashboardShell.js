"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  Bug,
  FileText,
  GalleryHorizontalEnd,
  House,
  Lock,
  LogOut,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import { auth } from "@/utils/firebase";

const tabs = [
  { id: "home", label: "Overview", icon: House, href: "/dashboard?tab=home" },
  { id: "affirmations", label: "Affirmations", icon: Sparkles, href: "/dashboard?tab=affirmations" },
  { id: "templates", label: "Templates", icon: FileText, href: "/dashboard/templates" },
  { id: "gallery", label: "Gallery", icon: GalleryHorizontalEnd, href: "/dashboard?tab=gallery" },
];

function tabIsActive(pathname, searchParams, tab) {
  if (tab.href === "/dashboard/templates") return pathname === "/dashboard/templates";
  const t = searchParams.get("tab") || "home";
  if (pathname !== "/dashboard") return false;
  if (tab.id === "home") return t === "home";
  if (tab.id === "affirmations") return t === "affirmations";
  if (tab.id === "gallery") return t === "gallery";
  return false;
}

function DashboardShellInner({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userLabel, setUserLabel] = useState("");
  const [debugMenuOpen, setDebugMenuOpen] = useState(false);
  const [showPaywallDemo, setShowPaywallDemo] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const debugMenuRef = useRef(null);

  const isPreviewRoute = pathname?.startsWith("/dashboard/preview");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user || user.isAnonymous) {
        setUserLabel("");
        router.replace("/login");
        return;
      }
      setUserLabel(user.email || `user:${user.uid.slice(0, 8)}`);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const onOutside = (e) => {
      if (debugMenuRef.current && !debugMenuRef.current.contains(e.target)) setDebugMenuOpen(false);
    };
    if (debugMenuOpen) document.addEventListener("click", onOutside);
    return () => document.removeEventListener("click", onOutside);
  }, [debugMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, searchParams]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/");
  };

  if (isPreviewRoute) {
    return children;
  }

  const onProfile = pathname === "/dashboard/profile";

  return (
    <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top,_rgba(88,28,135,0.10)_0%,_transparent_55%)]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/85 backdrop-blur-md border-b border-white/8">
        <div className="h-14 md:h-16 max-w-7xl mx-auto px-3 md:px-4 flex items-center justify-between gap-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/app_logo.svg" alt="LoA" width={28} height={28} className="rounded-lg" />
            <span className="text-white font-bold text-lg hidden sm:block">LoA</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = tabIsActive(pathname, searchParams, tab);
              const className = `inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-purple-500/15 text-white border border-purple-500/30"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`;
              return (
                <Link key={tab.id} href={tab.href} className={className}>
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-1 md:gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden rounded-lg p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="relative hidden sm:block" ref={debugMenuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDebugMenuOpen((v) => !v);
                }}
                className="rounded-lg p-2 text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
                title="Debug menu"
                aria-label="Debug menu"
                aria-expanded={debugMenuOpen}
              >
                <Bug className="h-5 w-5" />
              </button>
              {debugMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-white/10 bg-black/95 backdrop-blur py-1 shadow-xl z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaywallDemo(true);
                      setDebugMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left text-white/90 hover:bg-white/10 transition-colors"
                  >
                    <Lock className="h-4 w-4 text-amber-400/80" />
                    Paywall demo view
                  </button>
                </div>
              )}
            </div>
            <Link
              href="/dashboard/profile"
              className={`hidden sm:block rounded-full px-2.5 md:px-3 py-1.5 text-xs bg-white/5 border border-white/10 text-white/70 hover:text-white/90 hover:bg-white/10 transition-colors min-w-0 max-w-[42vw] sm:max-w-[220px] truncate ${
                onProfile ? "ring-1 ring-purple-500/40" : ""
              }`}
              title="Account settings"
            >
              {userLabel}
            </Link>
            <button
              onClick={handleLogout}
              className="text-white/70 hover:text-red-400 transition-colors p-1.5 md:p-2 shrink-0"
              title="Sign Out"
              type="button"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden px-3 pb-3 border-t border-white/5">
            <div className="mt-2 rounded-xl bg-black/90 backdrop-blur p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = tabIsActive(pathname, searchParams, tab);
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={`w-full rounded-lg px-3 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                      active
                        ? "bg-purple-500/15 text-white"
                        : "text-white/75 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
              <Link
                href="/dashboard/profile"
                className={`w-full rounded-lg px-3 py-2.5 text-sm transition-colors flex items-center justify-between gap-2 ${
                  onProfile
                    ? "bg-purple-500/15 text-white"
                    : "text-white/75 hover:text-white hover:bg-white/8"
                }`}
              >
                <span>Account settings</span>
                <span className="text-xs text-white/45 truncate max-w-[55vw]">{userLabel}</span>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {showPaywallDemo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowPaywallDemo(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Paywall demo"
        >
          <div
            className="bg-gradient-to-b from-slate-900 to-black border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 mb-4">
                <Lock className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Premium feature</h2>
              <p className="text-white/70 text-sm mb-6">
                This is how the paywall appears in the app. Upgrade to LoA Premium to unlock advanced
                manifestation tools and unlimited affirmations.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-2.5 text-sm transition-colors"
                >
                  View Premium
                </Link>
                <button
                  type="button"
                  onClick={() => setShowPaywallDemo(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 text-white/90 hover:bg-white/10 px-5 py-2.5 text-sm transition-colors"
                >
                  <X className="h-4 w-4" />
                  Close demo
                </button>
              </div>
            </div>
            <p className="px-6 pb-4 text-center text-[10px] text-white/40">Debug: Paywall demo view</p>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

export default function DashboardShell({ children }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <DashboardShellInner>{children}</DashboardShellInner>
    </Suspense>
  );
}
