import { NextResponse } from "next/server";
import crypto from "crypto";
import { getYouTubeRedirectUri } from "@/utils/youtubeOAuthConfig";

const LOG = (o) => console.log("[YouTube OAuth]", JSON.stringify(o));

function base64UrlEncode(buf) {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function buildSignedState(returnToPath, secret) {
  const payload = { r: crypto.randomBytes(24).toString("hex"), p: returnToPath || "" };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(Buffer.from(payloadJson, "utf8"));
  const sig = crypto.createHmac("sha256", secret).update(payloadJson).digest();
  const sigB64 = base64UrlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
].join(" ");

/**
 * GET /api/auth/youtube
 * Redirects to Google OAuth. Optional ?return_to=/path to redirect after success.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const showUri = searchParams.get("show_uri") === "1" || searchParams.get("show_uri") === "true";

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = getYouTubeRedirectUri();

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        error:
          "YouTube OAuth is not configured. Set GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET (or YOUTUBE_*).",
      },
      { status: 503 }
    );
  }

  if (!redirectUri.startsWith("http")) {
    return NextResponse.json(
      {
        error:
          "YouTube redirect URI is invalid. Set YOUTUBE_REDIRECT_URI or NEXT_PUBLIC_BASE_URL.",
      },
      { status: 503 }
    );
  }

  const returnTo = searchParams.get("return_to");
  const safeReturnTo =
    returnTo &&
    typeof returnTo === "string" &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//")
      ? returnTo
      : null;

  const state = buildSignedState(safeReturnTo, clientSecret);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    state,
    access_type: "offline",
    prompt: "consent",
  });
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  if (showUri) {
    return NextResponse.json({
      message:
        "Add this exact Redirect URI in Google Cloud Console (APIs & Services → Credentials → OAuth 2.0 → Authorized redirect URIs):",
      redirect_uri: redirectUri,
      auth_url: authUrl,
      hint: "Open the auth URL in the browser (without ?show_uri=1) to start OAuth.",
    });
  }

  LOG({ step: "redirect", return_to: safeReturnTo ?? null });
  return NextResponse.redirect(authUrl);
}
