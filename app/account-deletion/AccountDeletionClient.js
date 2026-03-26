"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/utils/firebase";

export default function AccountDeletionClient() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
      router.replace("/");
    } catch (err) {
      setError(err?.message || "Failed to delete account.");
    } finally {
      setLoading(false);
    }
  };

  if (!authReady) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t border-white/30" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-lg mx-auto px-6 pt-24 pb-16">

        <p className="text-xs text-white/35 uppercase tracking-wider mb-6">Account</p>
        <h1 className="text-2xl font-semibold mb-2">Delete account</h1>
        <p className="text-sm text-white/45 leading-relaxed">
          Permanently deletes your LoA account and all synced cloud data. This cannot be undone.
        </p>

        {done ? (
          <div className="mt-10">
            <p className="text-sm text-white/70">Your account has been deleted.</p>
            <p className="text-xs text-white/35 mt-1">You can close this screen. Thank you for using LoA.</p>
          </div>
        ) : !user ? (
          <div className="mt-10 space-y-4">
            <p className="text-sm text-white/55">Sign in first to complete account deletion.</p>
            <div className="flex gap-3">
              <Link
                href={`/login?redirect=${encodeURIComponent("/dashboard/account-deletion")}`}
                className="rounded-lg bg-white text-black px-4 py-2 text-sm font-medium"
              >
                Log in
              </Link>
              <Link
                href={`/signup?redirect=${encodeURIComponent("/dashboard/account-deletion")}`}
                className="rounded-lg px-4 py-2 text-sm text-white/55 hover:text-white transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10 space-y-6">

            <p className="text-sm text-white/50">
              Signed in as <span className="text-white/80">{user.email || user.uid}</span>
            </p>

            <label className="flex items-start gap-3 text-sm text-white/55 cursor-pointer">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-0.5 accent-white"
              />
              I understand this permanently deletes my account and data.
            </label>

            <div>
              <label className="block text-xs text-white/35 mb-2">
                Type <span className="text-white/70">DELETE</span> to confirm
              </label>
              <input
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-transparent border-b border-white/15 pb-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/35 transition-colors"
              />
            </div>

            {error && <p className="text-xs text-red-400/80">{error}</p>}

            <button
              type="button"
              disabled={!canDelete}
              onClick={() => setShowDeleteDialog(true)}
              className="text-xs text-white/30 underline decoration-white/15 underline-offset-4 hover:text-white/55 disabled:opacity-30 transition-colors"
            >
              {loading ? "Deleting…" : "Delete account"}
            </button>

          </div>
        )}

      </div>

      {showDeleteDialog && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0d0d0d] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-medium">Are you sure?</h2>
            <p className="text-sm text-white/45 leading-relaxed">
              This will permanently delete your account. There is no way back.
            </p>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteDialog(false)}
                disabled={loading}
                className="flex-1 rounded-lg px-3 py-2.5 text-sm text-white/45 hover:text-white disabled:opacity-40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleDelete();
                  setShowDeleteDialog(false);
                }}
                disabled={loading}
                className="flex-1 rounded-lg bg-white/6 px-3 py-2.5 text-sm text-white/75 hover:bg-white/10 disabled:opacity-40 transition-colors"
              >
                {loading ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
