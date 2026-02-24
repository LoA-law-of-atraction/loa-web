import { NextResponse } from "next/server";
import { getYouTubeCredentials } from "@/utils/youtubeAuth";

const LOG = (o) => console.log("[YouTube]", JSON.stringify(o));

/**
 * GET /api/auth/youtube/status
 * Returns whether YouTube is connected (credentials available for upload).
 * ?debug=1 adds debug object with access_token_preview.
 */
export async function GET(request) {
  try {
    LOG({ step: "status", action: "start" });
    const creds = await getYouTubeCredentials();
    const connected = !!(creds?.access_token);
    LOG({
      step: "status",
      outcome: connected ? "connected" : "not_connected",
      source: creds?._debug?.source ?? null,
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
