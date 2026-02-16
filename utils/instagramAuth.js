import { getAdminDb } from "@/utils/firebaseAdmin";

const INTEGRATIONS_DOC = "instagram";
const REFRESH_IF_EXPIRES_IN_DAYS = 7;

/**
 * Get Instagram credentials for Graph API posting.
 * Prefers env INSTAGRAM_USER_ID + INSTAGRAM_ACCESS_TOKEN; otherwise reads from Firestore (integrations/instagram)
 * and refreshes the token if it expires within REFRESH_IF_EXPIRES_IN_DAYS.
 * @returns {{ user_id: string, access_token: string } | null}
 */
export async function getInstagramCredentials() {
  const fromEnv = process.env.INSTAGRAM_USER_ID && process.env.INSTAGRAM_ACCESS_TOKEN;
  if (fromEnv) {
    return {
      user_id: process.env.INSTAGRAM_USER_ID,
      access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
    };
  }

  const db = getAdminDb();
  const ref = db.collection("integrations").doc(INTEGRATIONS_DOC);
  const snap = await ref.get();
  if (!snap.exists) return null;

  const data = snap.data();
  let accessToken = data.access_token;
  const userId = data.user_id;
  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0;
  const now = Date.now();
  const refreshThreshold = REFRESH_IF_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;

  if (expiresAt && expiresAt - now < refreshThreshold) {
    try {
      const { InstagramOAuthSdk } = await import("@microfox/instagram-oauth");
      const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
      if (!clientSecret) return userId && accessToken ? { user_id: userId, access_token: accessToken } : null;
      const sdk = new InstagramOAuthSdk({
        clientId: process.env.INSTAGRAM_CLIENT_ID || "",
        clientSecret,
        redirectUri: "",
      });
      const refreshed = await sdk.refreshToken(accessToken);
      accessToken = refreshed.accessToken;
      const newExpiresAt = new Date(now + refreshed.expiresIn * 1000).toISOString();
      await ref.update({
        access_token: accessToken,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Instagram token refresh failed:", e.message);
    }
  }

  if (!userId || !accessToken) return null;
  return { user_id: userId, access_token: accessToken };
}
