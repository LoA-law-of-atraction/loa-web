import { auth } from "@/utils/firebase";

async function authHeaders() {
  const u = auth.currentUser;
  if (!u) throw new Error("Not signed in");
  const token = await u.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function fetchUsageSummary() {
  const res = await fetch("/api/usage/summary", {
    headers: { ...(await authHeaders()) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Usage summary failed");
  return data;
}

/**
 * @param {number} deltaBytes Positive after upload, negative after delete
 */
export async function commitStorageDelta(deltaBytes) {
  const res = await fetch("/api/usage/storage-commit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
    },
    body: JSON.stringify({ deltaBytes }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || "Storage update failed");
    err.code = data.code;
    err.details = data;
    throw err;
  }
  return data.summary;
}

export function formatBytes(n) {
  const x = Number(n) || 0;
  if (x < 1024) return `${Math.round(x)} B`;
  if (x < 1024 * 1024) return `${(x / 1024).toFixed(1)} KB`;
  if (x < 1024 * 1024 * 1024) return `${(x / (1024 * 1024)).toFixed(1)} MB`;
  return `${(x / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * @param {{ storageUsed: number, storageLimit: number } | null} summary
 * @param {number} bytesToAdd
 */
export function canFitStorage(summary, bytesToAdd) {
  if (!summary) return true;
  const add = Number(bytesToAdd) || 0;
  return summary.storageUsed + add <= summary.storageLimit;
}

export function sumFileBytes(files) {
  if (!files?.length) return 0;
  return files.reduce((s, f) => s + (f.size || 0), 0);
}
