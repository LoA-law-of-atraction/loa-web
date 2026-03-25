"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/utils/firebase";

export default function AccountDeletionClient() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const canDelete = checked && confirmationText === "DELETE" && !loading;

  const handleDelete = async () => {
    if (!user || !canDelete) return;
    setError("");
    setLoading(true);
    try {
      const idToken = await user.getIdToken(true);
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          confirmation: confirmationText,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Failed to delete account.");

      await signOut(auth);
      setDone(true);
    } catch (err) {
      setError(err?.message || "Failed to delete account.");
    } finally {
      setLoading(false);
    }
  };

  if (!authReady) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-5">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white/70" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-5 py-16">
      <section className="mx-auto w-full max-w-xl rounded-2xl border border-white/15 bg-white/5 p-6 md:p-8">
        <p className="text-xs uppercase tracking-wider text-white/50">LoA Account Support</p>
        <h1 className="mt-2 text-2xl md:text-3xl font-semibold">Delete your account</h1>
        <p className="mt-2 text-sm text-white/70">
          This action permanently deletes your LoA account and synced cloud data. This cannot be
          undone.
        </p>

        {done ? (
          <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
            <p className="text-sm text-emerald-200 font-medium">Your account has been deleted.</p>
            <p className="text-xs text-emerald-100/80 mt-1">
              You can now close this screen. Thank you for trying LoA.
            </p>
          </div>
        ) : !user ? (
          <div className="mt-6 rounded-xl border border-white/15 bg-black/30 p-4">
            <p className="text-sm text-white/80">
              Sign in first, then return to this page to complete account deletion.
            </p>
            <div className="mt-3 flex gap-2">
              <Link
                href={`/login?redirect=${encodeURIComponent("/account-deletion")}`}
                className="rounded-lg bg-white text-black px-3 py-2 text-sm font-medium"
              >
                Log in
              </Link>
              <Link
                href={`/signup?redirect=${encodeURIComponent("/account-deletion")}`}
                className="rounded-lg border border-white/25 px-3 py-2 text-sm text-white/90"
              >
                Sign up
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-100">
                Signed in as <span className="font-medium">{user.email || user.uid}</span>
              </p>
            </div>

            <label className="flex items-start gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-0.5"
              />
              I understand this permanently deletes my LoA account and data.
            </label>

            <div>
              <label className="block text-xs text-white/60 mb-1.5">
                Type <span className="font-semibold text-white">DELETE</span> to confirm
              </label>
              <input
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-sm"
              />
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}

            <button
              type="button"
              disabled={!canDelete}
              onClick={handleDelete}
              className="w-full rounded-lg bg-red-500 text-white px-3 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {loading ? "Deleting account..." : "Delete account permanently"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
