"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardApiKeysPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/profile");
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white/50 text-sm">
      Redirecting...
    </div>
  );
}
