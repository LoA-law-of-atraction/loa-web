"use client";

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  Loader2,
  Check,
  Camera,
  ArrowLeft,
  Crown,
  Calendar,
  CreditCard,
  ChevronRight,
  Pencil,
  X,
} from "lucide-react";
import { auth, storage } from "@/utils/firebase";
import {
  DEFAULT_ENTITLEMENT_ID,
  RevenueCatProvider,
  useRevenueCat,
} from "@/contexts/RevenueCatContext";

const ACCEPT_IMAGE = "image/jpeg,image/png,image/webp,image/gif";
const MAX_SIZE_MB = 2;

function formatExpiry(customerInfo, entitlementId = "pro") {
  const entitlements = customerInfo?.entitlements;
  if (!entitlements) return null;
  const ent = entitlements[entitlementId] ?? entitlements.all?.[entitlementId];
  const date = ent?.expirationDate ?? ent?.expiresDate;
  if (!date) return null;
  try {
    const parsed = typeof date === "string" ? new Date(date) : date;
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return null;
  }
}

function ProfileContent({ user, refreshUser }) {
  const { isPro, isVip, customerInfo } = useRevenueCat();
  const fileInputRef = useRef(null);

  const [displayName, setDisplayName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState(null);

  useEffect(() => {
    if (user?.displayName != null && user.displayName !== "") {
      setDisplayName(user.displayName);
    } else if (user?.email) {
      setDisplayName(user.email.split("@")[0] || "");
    } else {
      setDisplayName("");
    }
  }, [user?.displayName, user?.email]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      await refreshUser();
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Profile update failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setPhotoError(`Image must be under ${MAX_SIZE_MB} MB.`);
      return;
    }
    setUploadingPhoto(true);
    try {
      const extension = file.name.split(".").pop() || "jpg";
      const storageRef = ref(storage, `profile-images/${user.uid}/avatar.${extension}`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const photoURL = await getDownloadURL(storageRef);
      await updateProfile(user, { photoURL });
      await refreshUser();
    } catch (err) {
      console.error("Profile photo upload failed:", err);
      setPhotoError(err?.message || "Upload failed. Try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      await updateProfile(user, { photoURL: "" });
      await refreshUser();
    } catch (err) {
      console.error("Remove photo failed:", err);
      setPhotoError(err?.message || "Could not remove photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const expiry = formatExpiry(customerInfo, DEFAULT_ENTITLEMENT_ID);
  const avatarSrc = user?.photoURL || "";
  const nameDisplay = user?.displayName || user?.email?.split("@")[0] || "Your Profile";
  const initials = nameDisplay.charAt(0).toUpperCase();

  return (
    <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-72 w-[40rem] rounded-full bg-accent/[0.04] blur-[100px]" />
      </div>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-white/25 hover:text-white/55 text-[13px] mb-10 transition-colors group"
      >
        <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        Dashboard
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-accent/60 mb-2">Account</p>
        <h1 className="font-tiempos text-[2rem] font-semibold leading-tight text-white">
          Your profile
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.05 }}
        className="flex items-center gap-5 mb-8 p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02]"
      >
        <div className="relative shrink-0">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              alt=""
              className="w-[68px] h-[68px] rounded-2xl object-cover ring-1 ring-white/15"
            />
          ) : (
            <div className="w-[68px] h-[68px] rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 ring-1 ring-accent/20 flex items-center justify-center text-[26px] font-semibold text-white">
              {initials}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-[#1a1a1c] border border-white/[0.14] text-white/45 hover:text-white hover:border-white/30 transition-all disabled:opacity-50 shadow-lg"
            title="Change photo"
          >
            {uploadingPhoto ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
          </button>
          <input ref={fileInputRef} type="file" accept={ACCEPT_IMAGE} className="hidden" onChange={handlePhotoChange} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-tiempos text-[1.2rem] font-semibold text-white leading-tight truncate">
            {nameDisplay}
          </p>
          <p className="text-white/35 text-[13px] mt-0.5 truncate">{user?.email}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full text-[11px] font-semibold px-2.5 py-1 border ${
              isPro
                ? "bg-accent/10 border-accent/25 text-accent"
                : "bg-white/[0.04] border-white/[0.08] text-white/35"
            }`}>
              <Crown className="w-3 h-3" />
              {isPro ? (isVip ? "VIP" : "Pro") : "Free plan"}
            </span>
            {expiry && (
              <span className="inline-flex items-center gap-1 text-[11px] text-white/30">
                <Calendar className="w-3 h-3" />
                through {expiry}
              </span>
            )}
          </div>
        </div>

        {avatarSrc && (
          <button
            type="button"
            onClick={handleRemovePhoto}
            disabled={uploadingPhoto}
            className="shrink-0 text-[12px] text-white/20 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            Remove
          </button>
        )}
      </motion.div>

      {photoError && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-red-400 mb-4 -mt-4"
        >
          {photoError}
        </motion.p>
      )}

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.1 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden mb-4"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <User className="w-3.5 h-3.5 text-accent" />
            </div>
            <h2 className="text-[13px] font-semibold text-white/80">Personal info</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsEditing((v) => !v);
              setSaved(false);
            }}
            className="flex items-center gap-1.5 text-[12px] text-white/30 hover:text-white/60 transition-colors"
          >
            {isEditing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            {isEditing ? "Cancel" : "Edit"}
          </button>
        </div>

        {!isEditing && (
          <div className="px-6 py-5 space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/25 mb-1.5">Email</p>
              <p className="text-[13px] text-white/50">{user?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/25 mb-1.5">Display name</p>
              <p className="text-[13px] text-white/70">{displayName || "—"}</p>
            </div>
          </div>
        )}

        {isEditing && (
          <form onSubmit={handleSave} className="px-6 py-5 space-y-5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email ?? ""}
                readOnly
                className="w-full rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-2.5 text-[13px] text-white/35 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-white/30 mb-2">
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                autoFocus
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[13px] text-white placeholder-white/20 focus:border-accent/40 focus:bg-white/[0.045] focus:outline-none focus:ring-1 focus:ring-accent/25 transition-all"
                maxLength={100}
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 disabled:opacity-50 ${
                  saved
                    ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400"
                    : "bg-accent hover:bg-accent/90 text-white shadow-[0_0_24px_rgba(35,131,226,0.2)] hover:shadow-[0_0_32px_rgba(35,131,226,0.35)]"
                }`}
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : null}
                {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-[13px] text-white/30 hover:text-white/55 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.15 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/[0.05]">
          <h2 className="text-[13px] font-semibold text-white/80">Account settings</h2>
        </div>
        <Link
          href="/dashboard/subscription"
          className="flex items-center gap-3.5 px-6 py-4 hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] group"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/[0.08]">
            <CreditCard className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-white/80 font-medium">Subscription</p>
            <p className="text-[11px] text-white/30 mt-0.5">Manage your plan and billing</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors shrink-0" />
        </Link>
      </motion.section>

      <p className="mt-10 text-white/15 text-[12px] text-center">
        <Link href="/dashboard" className="hover:text-white/40 transition-colors">Dashboard</Link>
        {" · "}
        <Link href="/dashboard/subscription" className="hover:text-white/40 transition-colors">Subscription</Link>
      </p>
    </div>
  );
}

export default function DashboardProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const refreshUser = async () => {
    const current = auth.currentUser;
    if (!current) return;
    await current.reload();
    setUser(auth.currentUser);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      try {
        if (!nextUser || nextUser.isAnonymous) {
          setUser(null);
          window.location.replace("/login");
          return;
        }
        setUser(nextUser);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t border-white/30" />
      </div>
    );
  }

  return (
    <RevenueCatProvider>
      <ProfileContent user={user} refreshUser={refreshUser} />
    </RevenueCatProvider>
  );
}
