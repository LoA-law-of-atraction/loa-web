import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  InstagramOAuthSdk,
  InstagramScope,
} from "@microfox/instagram-oauth";
import { getInstagramRedirectUri } from "@/utils/instagramOAuthConfig";

const INSTAGRAM_STATE_COOKIE = "instagram_oauth_state";
const INSTAGRAM_STATE_MAX_AGE = 600; // 10 min

function base64UrlEncode(buf) {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Build signed state so callback can verify without relying on cookies (which may not be sent on cross-site redirect). */
function buildSignedState(returnToPath, secret) {
  const payload = { r: crypto.randomBytes(24).toString("hex"), p: returnToPath || "" };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(Buffer.from(payloadJson, "utf8"));
  const sig = crypto.createHmac("sha256", secret).update(payloadJson).digest();
  const sigB64 = base64UrlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const showUri = searchParams.get("show_uri") === "1" || searchParams.get("show_uri") === "true";
  const debug = searchParams.get("debug") === "1" || searchParams.get("debug") === "true";

  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri = getInstagramRedirectUri();

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Instagram OAuth is not configured. Set INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET." },
      { status: 503 }
    );
  }

  if (!redirectUri.startsWith("http")) {
    return NextResponse.json(
      { error: "Instagram redirect URI is invalid. Set INSTAGRAM_REDIRECT_URI or NEXT_PUBLIC_BASE_URL." },
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

  const sdk = new InstagramOAuthSdk({
    clientId,
    clientSecret,
    redirectUri,
    state,
    scopes: [
      InstagramScope.INSTAGRAM_BUSINESS_BASIC,
      InstagramScope.INSTAGRAM_BUSINESS_MANAGE_MESSAGES,
      InstagramScope.INSTAGRAM_BUSINESS_MANAGE_COMMENTS,
      InstagramScope.INSTAGRAM_BUSINESS_CONTENT_PUBLISH,
      InstagramScope.INSTAGRAM_BUSINESS_MANAGE_INSIGHTS,
    ],
  });
  const authUrl = sdk.getAuthUrl(state);

  if (debug || showUri) {
    const envSource = process.env.INSTAGRAM_REDIRECT_URI
      ? "INSTAGRAM_REDIRECT_URI"
      : process.env.NEXT_PUBLIC_BASE_URL
        ? "NEXT_PUBLIC_BASE_URL"
        : process.env.VERCEL_URL
          ? "VERCEL_URL"
          : "default (localhost:3000)";
    const info = {
      redirect_uri: redirectUri,
      redirect_uri_source: envSource,
      auth_url: authUrl,
      next_step: "Add the redirect_uri above to Meta app (Instagram → API setup → Valid OAuth Redirect URIs), then open the link below to start OAuth.",
      start_oauth_url: request.url.replace(/\?.*$/, "").replace(/\/$/, "") || "/api/auth/instagram",
    };
    if (debug) {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Instagram OAuth debug</title></head><body style="font-family:sans-serif;max-width:720px;margin:2rem auto;padding:1rem;">
<h1>Instagram OAuth – redirect_uri (visible in browser)</h1>
<p><strong>1. OAuth (for “Connect Instagram”)</strong><br>Add this exact URL in Meta: <strong>Instagram</strong> → <strong>API setup</strong> → <strong>Valid OAuth Redirect URIs</strong> (not Webhooks):</p>
<pre style="background:#f0f0f0;padding:1rem;overflow:auto;word-break:break-all;">${redirectUri}</pre>
<p>Source: <code>${envSource}</code></p>
<p><strong>2. If Meta shows “Callback URL or verify token couldn’t be validated”</strong><br>That is the <strong>Webhooks</strong> section. For “Connect Instagram” you only need step 1 above. If you must set a webhook: use Callback URL <code>https://your-domain.com/api/webhooks/instagram</code> and set <code>INSTAGRAM_WEBHOOK_VERIFY_TOKEN</code> in .env to the same Verify token you type in Meta.</p>
<p><strong>Full auth URL</strong> we redirect to:</p>
<pre style="background:#f0f0f0;padding:1rem;overflow:auto;word-break:break-all;font-size:12px;">${authUrl}</pre>
<p><a href="${info.start_oauth_url}" style="display:inline-block;background:#333;color:fff;padding:0.75rem 1.5rem;text-decoration:none;border-radius:6px;">Start OAuth (after adding URI to Meta)</a></p>
<p style="color:#666;">Remove <code>?debug=1</code> from the URL to start the real OAuth flow.</p>
</body></html>`;
      return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    return NextResponse.json({
      message: "Add this exact Redirect URI in your Meta app (Instagram product → API setup → OAuth redirect URIs):",
      redirect_uri: redirectUri,
      redirect_uri_source: envSource,
      auth_url: authUrl,
      hint: "Copy the redirect_uri value above, then start the flow again without ?show_uri=1. Or use ?debug=1 to see this in an HTML page.",
      localhost: "If you're on localhost, add this in Meta and use this URL to see the URI:",
      localhost_redirect_uri: "http://localhost:3000/api/auth/instagram/callback",
      localhost_show_uri_url: "http://localhost:3000/api/auth/instagram?show_uri=1",
    });
  }

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(INSTAGRAM_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: INSTAGRAM_STATE_MAX_AGE,
    path: "/",
  });
  return res;
}
