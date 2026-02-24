import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { getYouTubeRedirectUri } from "@/utils/youtubeOAuthConfig";

const LOG = (o) => console.log("[YouTube OAuth]", JSON.stringify(o));
const INTEGRATIONS_DOC = "youtube";

function base64UrlDecode(str) {
  const pad = (n) => "=".repeat((4 - (n % 4)) % 4);
  return Buffer.from(
    str.replace(/-/g, "+").replace(/_/g, "/") + pad(str.length),
    "base64"
  ).toString("utf8");
}

function verifySignedStateAndGetReturnPath(stateParam, secret) {
  if (!stateParam || typeof stateParam !== "string" || !secret) return null;
  const dot = stateParam.indexOf(".");
  if (dot === -1) return null;
  const payloadB64 = stateParam.slice(0, dot);
  const sigB64 = stateParam.slice(dot + 1);
  try {
    const payloadJson = base64UrlDecode(payloadB64);
    const sig = Buffer.from(
      sigB64.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (sigB64.length % 4)) % 4),
      "base64"
    );
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(payloadJson)
      .digest();
    if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(sig, expectedSig))
      return null;
    const payload = JSON.parse(payloadJson);
    const path = payload?.p;
    return typeof path === "string" && path.startsWith("/") && !path.startsWith("//")
      ? path
      : null;
  } catch {
    return null;
  }
}

function getSuccessRedirectBase(returnToPath = null) {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const baseUrl = (base || "").replace(/\/+$/, "");
  if (returnToPath && returnToPath.startsWith("/")) return `${baseUrl}${returnToPath}`;
  if (process.env.YOUTUBE_SUCCESS_REDIRECT) {
    const r = process.env.YOUTUBE_SUCCESS_REDIRECT.replace(/\/+$/, "");
    return r.includes("?") ? r : `${r}?step=7`;
  }
  return `${baseUrl}/admin/video-generator?step=7`;
}

/**
 * GET /api/auth/youtube/callback
 * Google redirects here with ?code=...&state=...
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  LOG({ step: "callback", hasCode: !!code, hasState: !!state, hasError: !!errorParam });

  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET;
  const returnToPath = verifySignedStateAndGetReturnPath(state, clientSecret);

  const redirectBase = getSuccessRedirectBase(returnToPath);
  const successUrl = redirectBase.includes("?")
    ? `${redirectBase}&youtube=connected`
    : `${redirectBase}?youtube=connected`;
  const failUrlWithReason = (reason) =>
    redirectBase.includes("?")
      ? `${redirectBase}&youtube=error&reason=${encodeURIComponent(reason)}`
      : `${redirectBase}?youtube=error&reason=${encodeURIComponent(reason)}`;

  if (errorParam) {
    LOG({
      step: "callback",
      outcome: "redirect_fail",
      reason: "oauth_error",
      error: errorParam,
      error_description: searchParams.get("error_description"),
    });
    return NextResponse.redirect(failUrlWithReason("oauth_error"));
  }

  if (!code || !state) {
    LOG({ step: "callback", outcome: "redirect_fail", reason: "missing_code_or_state" });
    return NextResponse.redirect(failUrlWithReason("missing_code_or_state"));
  }

  if (returnToPath === null) {
    LOG({ step: "callback", outcome: "redirect_fail", reason: "state_invalid" });
    return NextResponse.redirect(failUrlWithReason("state_invalid"));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
  const redirectUri = getYouTubeRedirectUri();

  if (!clientId || !clientSecret) {
    LOG({ step: "callback", outcome: "redirect_fail", reason: "missing_env" });
    return NextResponse.redirect(failUrlWithReason("missing_env"));
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    LOG({
      step: "callback",
      outcome: "redirect_fail",
      reason: "exchange_error",
      status: tokenRes.status,
      body: errText?.slice(0, 300),
    });
    return NextResponse.redirect(failUrlWithReason("exchange_error"));
  }

  const tokens = await tokenRes.json();
  const accessToken = (tokens.access_token || "").replace(/\s+/g, "").trim();
  const refreshToken = (tokens.refresh_token || "").replace(/\s+/g, "").trim();
  const expiresIn = typeof tokens.expires_in === "number" ? tokens.expires_in : 3600;

  if (!accessToken) {
    LOG({ step: "callback", outcome: "redirect_fail", reason: "missing_after_exchange" });
    return NextResponse.redirect(failUrlWithReason("missing_after_exchange"));
  }

  const db = getAdminDb();
  const ref = db.collection("integrations").doc(INTEGRATIONS_DOC);
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  await ref.set({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });

  LOG({ step: "callback", outcome: "success", redirect: "successUrl" });
  return NextResponse.redirect(successUrl);
}
