import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  InstagramOAuthSdk,
  InstagramScope,
} from "@microfox/instagram-oauth";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { getInstagramRedirectUri } from "@/utils/instagramOAuthConfig";

const LOG = (o) => console.log("[Instagram]", JSON.stringify(o));
const INSTAGRAM_STATE_COOKIE = "instagram_oauth_state";
const INTEGRATIONS_DOC = "instagram";

/** Parse return path from state (format: hex or hex:encodeURIComponent(path)). */
function parseReturnToFromState(stateParam) {
  if (!stateParam || typeof stateParam !== "string") return null;
  const idx = stateParam.indexOf(":");
  if (idx === -1) return null;
  try {
    const path = decodeURIComponent(stateParam.slice(idx + 1));
    return path && path.startsWith("/") && !path.startsWith("//") ? path : null;
  } catch {
    return null;
  }
}

function getSuccessRedirectBase(returnToPath = null) {
  if (returnToPath && returnToPath.startsWith("/")) {
    const base = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const baseUrl = (base || "").replace(/\/+$/, "");
    return `${baseUrl}${returnToPath}`;
  }
  if (process.env.INSTAGRAM_SUCCESS_REDIRECT) {
    const base = process.env.INSTAGRAM_SUCCESS_REDIRECT.replace(/\/+$/, "");
    return base.includes("?") ? base : `${base}?step=7`;
  }
  const base = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const baseUrl = (base || "").replace(/\/+$/, "");
  return `${baseUrl}/admin/video-generator?step=7`;
}

function redirectAndClearCookies(url) {
  const res = NextResponse.redirect(url);
  res.cookies.delete(INSTAGRAM_STATE_COOKIE);
  return res;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  LOG({ step: "callback", action: "start", hasCode: !!code, hasState: !!state, hasError: !!errorParam });

  const returnToPath = parseReturnToFromState(state);
  if (returnToPath) LOG({ step: "callback", return_to: returnToPath });

  const redirectBase = getSuccessRedirectBase(returnToPath);
  const successUrl = redirectBase.includes("?") ? `${redirectBase}&instagram=connected` : `${redirectBase}?instagram=connected`;
  const failUrlWithReason = (reason) =>
    redirectBase.includes("?")
      ? `${redirectBase}&instagram=error&reason=${encodeURIComponent(reason)}`
      : `${redirectBase}?instagram=error&reason=${encodeURIComponent(reason)}`;

  if (errorParam) {
    LOG({ step: "callback", outcome: "redirect_fail", reason: "oauth_error", error: errorParam, error_description: searchParams.get("error_description") });
    return redirectAndClearCookies(failUrlWithReason("oauth_error"));
  }

  if (!code || !state) {
    LOG({ step: "callback", outcome: "redirect_fail", reason: "missing_code_or_state" });
    return redirectAndClearCookies(failUrlWithReason("missing_code_or_state"));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(INSTAGRAM_STATE_COOKIE)?.value;
  if (!savedState || savedState !== state) {
    LOG({ step: "callback", outcome: "redirect_fail", reason: "state_mismatch", hasSavedState: !!savedState, stateLength: state?.length, savedStateLength: savedState?.length });
    return redirectAndClearCookies(failUrlWithReason("state_mismatch"));
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri = getInstagramRedirectUri();
  LOG({ step: "callback", action: "exchange_prep", redirect_uri: redirectUri, hasClientId: !!clientId, hasClientSecret: !!clientSecret });

  if (!clientId || !clientSecret) {
    LOG({ step: "callback", outcome: "redirect_fail", reason: "missing_env" });
    return redirectAndClearCookies(failUrlWithReason("missing_env"));
  }

  const sdk = new InstagramOAuthSdk({
    clientId,
    clientSecret,
    redirectUri,
    state,
    scopes: [InstagramScope.INSTAGRAM_BUSINESS_CONTENT_PUBLISH],
  });

  let tokens;
  try {
    tokens = await sdk.exchangeCodeForTokens(code);
    LOG({
      step: "callback",
      action: "exchange_ok",
      accessToken_type: typeof tokens?.accessToken,
      accessToken_length: typeof tokens?.accessToken === "string" ? tokens.accessToken.length : 0,
      userId_type: typeof tokens?.userId,
      userId_length: typeof tokens?.userId === "string" ? tokens.userId.length : 0,
    });
  } catch (e) {
    LOG({ step: "callback", outcome: "redirect_fail", reason: "exchange_error", error: e.message, stack: e.stack?.slice(0, 200) });
    return redirectAndClearCookies(failUrlWithReason("exchange_error"));
  }

  const accessToken = typeof tokens.accessToken === "string" ? tokens.accessToken.trim() : "";
  const userId = typeof tokens.userId === "string" ? tokens.userId.trim() : String(tokens.userId ?? "");
  if (!accessToken || !userId) {
    LOG({ step: "callback", outcome: "redirect_fail", reason: "missing_after_exchange", hasToken: !!accessToken, hasUserId: !!userId });
    return redirectAndClearCookies(failUrlWithReason("missing_after_exchange"));
  }

  const db = getAdminDb();
  const ref = db.collection("integrations").doc(INTEGRATIONS_DOC);
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days
  LOG({ step: "callback", action: "firestore_set", user_id_length: userId.length, access_token_length: accessToken.length });

  await ref.set({
    user_id: userId,
    access_token: accessToken,
    expires_at: expiresAt.toISOString(),
    updated_at: new Date().toISOString(),
  });

  LOG({ step: "callback", outcome: "success", redirect: "successUrl" });
  return redirectAndClearCookies(successUrl);
}
