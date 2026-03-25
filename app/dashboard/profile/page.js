"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/utils/firebase";

export default function DashboardProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      try {
        if (!nextUser || nextUser.isAnonymous) {
          setUser(null);
          router.replace("/login");
          return;
        }
        const activeUser = nextUser;
        setUser(activeUser);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const displayName = useMemo(() => {
    if (!user) return "";
    return user.displayName || user.email || `Guest ${user.uid.slice(0, 8)}`;
  }, [user]);

  const avatarFallback = useMemo(() => {
    if (!displayName) return "?";
    return displayName.trim().charAt(0).toUpperCase();
  }, [displayName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t border-white/30" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-lg mx-auto px-6 pt-28 pb-16">

        {/* Avatar + identity */}
        <div className="flex items-center gap-4 mb-10">
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={displayName}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-white/8 flex items-center justify-center text-base font-medium text-white/60">
              {avatarFallback}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-base font-medium leading-tight break-all">{displayName}</p>
            {user?.email && (
              <p className="text-sm text-white/40 break-all mt-0.5">{user.email}</p>
            )}
          </div>
        </div>

        {/* Danger zone */}
        <div className="mt-10">
          <Link
            href="/dashboard/account-deletion"
            className="text-xs text-white/30 underline decoration-white/15 underline-offset-4 hover:text-white/50 transition-colors"
          >
            Delete account
          </Link>
        </div>

      </div>
    </div>
  );
}
