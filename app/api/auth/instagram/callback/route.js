import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  InstagramOAuthSdk,
  InstagramScope,
} from "@microfox/instagram-oauth";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { getInstagramRedirectUri } from "@/utils/instagramOAuthConfig";

const INSTAGRAM_STATE_COOKIE = "instagram_oauth_state";
const INTEGRATIONS_DOC = "instagram";

function getSuccessRedirectBase() {
  if (process.env.INSTAGRAM_SUCCESS_REDIRECT) {
    return process.env.INSTAGRAM_SUCCESS_REDIRECT.replace(/\/+$/, "");
  }
  const base = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const baseUrl = (base || "").replace(/\/+$/, "");
  return `${baseUrl}/admin/video-generator`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const redirectBase = getSuccessRedirectBase();
  const successUrl = redirectBase.includes("?") ? `${redirectBase}&instagram=connected` : `${redirectBase}?instagram=connected`;
  const failUrl = redirectBase.includes("?") ? `${redirectBase}&instagram=error` : `${redirectBase}?instagram=error`;

  if (errorParam) {
    console.error("Instagram OAuth error:", errorParam, searchParams.get("error_description"));
    return NextResponse.redirect(failUrl);
  }

  if (!code || !state) {
    return NextResponse.redirect(failUrl);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(INSTAGRAM_STATE_COOKIE)?.value;
  if (!savedState || savedState !== state) {
    console.error("Instagram OAuth state mismatch");
    return NextResponse.redirect(failUrl);
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri = getInstagramRedirectUri();

  console.log("[Instagram OAuth] Callback – redirect_uri used for token exchange:", redirectUri);

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(failUrl);
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
  } catch (e) {
    console.error("Instagram token exchange failed:", e);
    return NextResponse.redirect(failUrl);
  }

  const db = getAdminDb();
  const ref = db.collection("integrations").doc(INTEGRATIONS_DOC);
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days
  await ref.set({
    user_id: tokens.userId,
    access_token: tokens.accessToken,
    expires_at: expiresAt.toISOString(),
    updated_at: new Date().toISOString(),
  });

  const res = NextResponse.redirect(successUrl);
  res.cookies.delete(INSTAGRAM_STATE_COOKIE);
  return res;
}
