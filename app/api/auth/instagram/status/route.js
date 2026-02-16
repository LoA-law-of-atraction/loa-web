import { NextResponse } from "next/server";
import { getInstagramCredentials } from "@/utils/instagramAuth";

const LOG = (o) => console.log("[Instagram]", JSON.stringify(o));

/**
 * GET /api/auth/instagram/status
 * Returns whether Instagram is connected (credentials available for posting).
 * ?debug=1 adds debug object with access_token_preview (and full access_token if INSTAGRAM_DEBUG_SHOW_TOKEN=1).
 */
export async function GET(request) {
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
    const { searchParams } = new URL(request.url);
    const withDebug = searchParams.get("debug") === "1" || searchParams.get("debug") === "true";
    const body = { connected };
    if (withDebug && creds?._debug) body.debug = creds._debug;
    return NextResponse.json(body);
  } catch (e) {
    LOG({ step: "status", outcome: "error", error: e.message });
    return NextResponse.json({ connected: false });
  }
}
