"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { ArrowRight, Sparkles } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { auth } from "@/utils/firebase";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace(redirectTo);
    });
    return () => unsub();
  }, [redirectTo, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      router.replace(redirectTo);
    } catch (err) {
      setError(err?.message || "Failed to sign up.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.replace(redirectTo);
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/popup-blocked" || code === "auth/cancelled-popup-request") {
        try {
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          setError(redirectErr?.message || "Google sign-up failed.");
        }
      } else {
        setError(err?.message || "Google sign-up failed.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden pt-28 pb-14 min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#020617_55%,_#000_100%)] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute top-20 -right-16 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-md px-4">
        <section className="rounded-3xl border border-white/15 bg-white/5 backdrop-blur-xl p-6 md:p-7 shadow-2xl shadow-black/30">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs tracking-wider text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            LoA Dashboard
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Create account</h1>
          <p className="mt-1 text-sm text-slate-300">Start using your personalized LoA dashboard.</p>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            className="mt-5 w-full rounded-xl border border-white/20 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 inline-flex items-center justify-center gap-2 hover:bg-slate-100 disabled:opacity-60"
          >
            <FcGoogle className="h-5 w-5" />
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </button>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/15" />
            <span className="text-xs text-slate-400">or</span>
            <div className="h-px flex-1 bg-white/15" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
              className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm"
            />
            {error && <p className="text-sm text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-400 text-slate-950 px-3 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Sign up"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-300 text-center">
            Already have an account?{" "}
            <Link
              href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
              className="text-cyan-300 hover:text-cyan-200"
            >
              Log in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

function SignupPageFallback() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#020617_55%,_#000_100%)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400/70" />
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageFallback />}>
      <SignupContent />
    </Suspense>
  );
}
