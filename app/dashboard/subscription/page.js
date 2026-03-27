"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SubscriptionPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/profile#subscription");
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-white/60 text-sm">
      Redirecting to profile...
    </div>
  );
}
