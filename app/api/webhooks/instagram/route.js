import { NextResponse } from "next/server";

/** Force server-side run; never cache so Meta always gets a fresh response */
export const dynamic = "force-dynamic";

/**
 * Meta webhook verification (Instagram/Facebook).
 * Used when Meta app asks for "Callback URL" + "Verify token" (e.g. Webhooks section).
 * NOT used for OAuth redirect – OAuth uses /api/auth/instagram/callback and
 * "Valid OAuth Redirect URIs" in Instagram → API setup.
 *
 * Set INSTAGRAM_WEBHOOK_VERIFY_TOKEN in .env to the same string you enter as
 * "Verify token" in the Meta app. Meta will GET this URL with hub.mode=subscribe
 * and hub.verify_token=...; we return hub.challenge if the token matches.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && expectedToken && token === expectedToken && challenge) {
    return new NextResponse(challenge, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Help debug: when Meta (or you) hit this URL, body explains what’s wrong
  const reason = !expectedToken
    ? "INSTAGRAM_WEBHOOK_VERIFY_TOKEN (or FACEBOOK_WEBHOOK_VERIFY_TOKEN) is not set in this environment. Add it in your host's Environment Variables (e.g. Vercel) and redeploy."
    : mode !== "subscribe"
      ? "hub.mode is not 'subscribe'."
      : token !== expectedToken
        ? "hub.verify_token does not match."
        : !challenge
          ? "hub.challenge is missing."
          : "Verification failed.";
  console.warn("[Instagram webhook] Verification failed:", { mode, tokenPresent: !!token, expectedSet: !!expectedToken, challengePresent: !!challenge });
  return new NextResponse(reason, { status: 403, headers: { "Content-Type": "text/plain" } });
}
