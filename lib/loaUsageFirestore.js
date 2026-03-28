import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/utils/firebaseAdmin";
import {
  currentUsageMonthKey,
  limitsForTier,
  nextUtcMonthStartIso,
} from "@/lib/loaPlanLimits";
import { resolveSubscriberTier } from "@/lib/loaRevenueCatServer";

const USAGE_DOC = () => "loa";

function usageRef(uid) {
  return getAdminDb().doc(`users/${uid}/usage/${USAGE_DOC()}`);
}

/**
 * @param {string} uid
 */
export async function getUsageSnapshot(uid) {
  const snap = await usageRef(uid).get();
  return snap.exists ? snap.data() || {} : {};
}

/**
 * @param {string} uid
 */
export async function getUsageSummaryForUser(uid) {
  const tier = await resolveSubscriberTier(uid);
  const limits = limitsForTier(tier);
  const raw = await getUsageSnapshot(uid);
  const monthKey = currentUsageMonthKey();
  let aiUsed = Number(raw.aiGenerationsThisMonth || 0);
  if (raw.usageMonth !== monthKey) {
    aiUsed = 0;
  }
  const storageUsed = Math.max(0, Number(raw.storageBytesUsed || 0));

  return {
    tier,
    limits,
    aiUsed,
    aiLimit: limits.aiMonthly,
    storageUsed,
    storageLimit: limits.storageBytes,
    usageMonth: monthKey,
    aiResetsAt: nextUtcMonthStartIso(),
  };
}

/**
 * Atomically increment AI generation count after a successful generation.
 * @param {string} uid
 */
export async function incrementAiGeneration(uid) {
  const tier = await resolveSubscriberTier(uid);
  const limits = limitsForTier(tier);
  const max = limits.aiMonthly;
  const monthKey = currentUsageMonthKey();

  const ref = usageRef(uid);
  await getAdminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() || {} : {};
    let count = Number(data.aiGenerationsThisMonth || 0);
    if (data.usageMonth !== monthKey) {
      count = 0;
    }
    if (count >= max) {
      throw Object.assign(new Error("AI_LIMIT"), {
        code: "AI_LIMIT",
        resetAt: nextUtcMonthStartIso(),
      });
    }
    tx.set(
      ref,
      {
        aiGenerationsThisMonth: count + 1,
        usageMonth: monthKey,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });
}

/**
 * Apply storage delta (upload +size, delete -size). Enforces tier cap.
 * @param {string} uid
 * @param {number} deltaBytes
 */
export async function applyStorageDelta(uid, deltaBytes) {
  const delta = Number(deltaBytes);
  if (!Number.isFinite(delta) || delta === 0) {
    return getUsageSummaryForUser(uid);
  }

  const tier = await resolveSubscriberTier(uid);
  const limits = limitsForTier(tier);
  const maxBytes = limits.storageBytes;
  const ref = usageRef(uid);

  await getAdminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() || {} : {};
    let used = Math.max(0, Number(data.storageBytesUsed || 0));
    const next = used + delta;
    if (next < 0) {
      used = 0;
    } else if (next > maxBytes) {
      throw Object.assign(new Error("STORAGE_LIMIT"), {
        code: "STORAGE_LIMIT",
        limitBytes: maxBytes,
        usedBytes: used,
        deltaBytes: delta,
      });
    } else {
      used = next;
    }
    tx.set(
      ref,
      {
        storageBytesUsed: used,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

  return getUsageSummaryForUser(uid);
}
