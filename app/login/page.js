"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { ArrowRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { auth } from "@/utils/firebase";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace(redirectTo);
    } catch (err) {
      setError(err?.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
          setError(redirectErr?.message || "Google sign-in failed.");
        }
      } else {
        setError(err?.message || "Google sign-in failed.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden min-h-screen bg-black text-white flex items-center justify-center pt-24 pb-12 px-4">
      {/* Ambient background — matches landing page palette */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-700/15 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-indigo-700/15 blur-3xl" />
        {/* Star dots */}
        <div className="absolute top-1/4 left-[15%] w-1 h-1 bg-white/30 rounded-full animate-pulse" />
        <div className="absolute top-[35%] right-[18%] w-0.5 h-0.5 bg-purple-300/50 rounded-full animate-ping" />
        <div className="absolute bottom-[30%] left-[40%] w-1 h-1 bg-indigo-300/30 rounded-full animate-pulse" />
        <div className="absolute top-[60%] right-[35%] w-0.5 h-0.5 bg-white/20 rounded-full animate-ping" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Gradient border glow card */}
        <div className="p-px rounded-3xl bg-gradient-to-br from-purple-500/30 via-white/5 to-indigo-500/20">
          <section className="rounded-3xl bg-[#060010]/95 backdrop-blur-xl px-7 py-8 md:px-9 md:py-10">

            {/* Brand header */}
            <div className="flex items-center gap-2.5 mb-7">
              <Image src="/app_logo.svg" alt="LoA" width={28} height={28} />
              <span className="text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
                Law of Attraction
              </span>
            </div>

            <h1 className="font-tiempos text-[2rem] font-bold text-white leading-tight mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-white/45 mb-1">
              Continue your conscious journey.
            </p>
            <blockquote className="mt-3 mb-7 text-xs text-white/30 italic border-l-2 border-purple-500/40 pl-3 leading-relaxed">
              &ldquo;What you think about, you bring about.&rdquo;
            </blockquote>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full rounded-xl border border-white/12 bg-white/6 hover:bg-white/10 px-4 py-3 text-sm font-medium text-white inline-flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-50"
            >
              <FcGoogle className="h-5 w-5" />
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/8" />
              <span className="text-xs text-white/25">or with email</span>
              <div className="h-px flex-1 bg-white/8" />
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-purple-500/50 focus:bg-white/8 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-purple-500/50 focus:bg-white/8 focus:ring-1 focus:ring-purple-500/20 transition-all duration-200"
              />

              {error && (
                <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 leading-relaxed">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 px-4 py-3 text-sm font-semibold text-white inline-flex items-center justify-center gap-1.5 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-purple-500/20"
              >
                {loading ? "Signing in…" : "Sign in"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-6 text-sm text-white/35 text-center">
              No account?{" "}
              <Link
                href={`/signup?redirect=${encodeURIComponent(redirectTo)}`}
                className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                Create one
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function LoginPageFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400/70" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginContent />
    </Suspense>
  );
}
