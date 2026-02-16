import { NextResponse } from "next/server";
import { getInstagramCredentials } from "@/utils/instagramAuth";

const LOG = (o) => console.log("[Instagram]", JSON.stringify(o));

/**
 * GET /api/auth/instagram/status
 * Returns whether Instagram is connected (credentials available for posting).
 */
export async function GET() {
  try {
    LOG({ step: "status", action: "start" });
    const creds = await getInstagramCredentials();
    const connected = !!(creds?.user_id && creds?.access_token);
    LOG({
      step: "status",
      outcome: connected ? "connected" : "not_connected",
      source: creds?._debug?.source ?? null,
      user_id_length: creds?.user_id?.length ?? 0,
      access_token_length: creds?.access_token?.length ?? 0,
    });
    return NextResponse.json({ connected });
  } catch (e) {
    LOG({ step: "status", outcome: "error", error: e.message });
    return NextResponse.json({ connected: false });
  }
}
