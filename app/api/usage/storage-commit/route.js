import { NextResponse } from "next/server";
import { getUidFromAuthHeader } from "@/lib/loaAuthServer";
import { applyStorageDelta } from "@/lib/loaUsageFirestore";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const auth = await getUidFromAuthHeader(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized", code: "AUTH" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const deltaBytes = Number(body.deltaBytes);
    if (!Number.isFinite(deltaBytes)) {
      return NextResponse.json({ error: "deltaBytes required", code: "BAD_REQUEST" }, { status: 400 });
    }
    try {
      const summary = await applyStorageDelta(auth.uid, deltaBytes);
      return NextResponse.json({ ok: true, summary });
    } catch (e) {
      if (e?.code === "STORAGE_LIMIT") {
        return NextResponse.json(
          {
            error: "Storage limit reached for your plan. Upgrade for more cloud backup.",
            code: "STORAGE_LIMIT",
            limitBytes: e.limitBytes,
            usedBytes: e.usedBytes,
          },
          { status: 403 },
        );
      }
      throw e;
    }
  } catch (e) {
    console.error("[usage/storage-commit]", e);
    return NextResponse.json({ error: "Failed to update storage usage" }, { status: 500 });
  }
}
