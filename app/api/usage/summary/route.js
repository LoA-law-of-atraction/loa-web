import { NextResponse } from "next/server";
import { getUidFromAuthHeader } from "@/lib/loaAuthServer";
import { getUsageSummaryForUser } from "@/lib/loaUsageFirestore";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const auth = await getUidFromAuthHeader(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized", code: "AUTH" }, { status: 401 });
    }
    const summary = await getUsageSummaryForUser(auth.uid);
    return NextResponse.json(summary);
  } catch (e) {
    console.error("[usage/summary]", e);
    return NextResponse.json({ error: "Failed to load usage" }, { status: 500 });
  }
}
