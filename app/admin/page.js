"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/blog");
  }, [router]);

  return (
    <div className="admin-card-solid max-w-md mx-auto p-6 text-center">
      <p className="admin-muted">Redirecting...</p>
    </div>
  );
}
