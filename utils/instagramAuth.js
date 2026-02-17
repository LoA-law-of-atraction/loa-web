import { getAdminDb } from "@/utils/firebaseAdmin";

const INTEGRATIONS_DOC = "instagram";
const REFRESH_IF_EXPIRES_IN_DAYS = 7;

const LOG = (obj) => console.log("[Instagram]", JSON.stringify(obj));

/** Mask token for debug display (first 8 + ... + last 4). */
function tokenPreview(token) {
  if (typeof token !== "string" || !token) return "";
  if (token.length <= 12) return token.slice(0, 4) + "…";
  return token.slice(0, 8) + "…" + token.slice(-4);
}

/**
 * Build debug info for API responses.
 * Includes access_token_preview (masked). Set INSTAGRAM_DEBUG_SHOW_TOKEN=1 to include full access_token (debug only).
 */
function buildDebug(source, user_id, access_token) {
  const showFull = process.env.INSTAGRAM_DEBUG_SHOW_TOKEN === "1" || process.env.INSTAGRAM_DEBUG_SHOW_TOKEN === "true";
  const out = {
    source,
    user_id_type: typeof user_id,
    user_id_length: typeof user_id === "string" ? user_id.length : 0,
    access_token_type: typeof access_token,
    access_token_length: typeof access_token === "string" ? access_token.length : 0,
    access_token_preview: tokenPreview(access_token),
  };
  if (showFull && typeof access_token === "string") out.access_token = access_token;
  return out;
}

/** Normalize token: trim and remove any whitespace/invisible chars that can cause "Cannot parse access token". */
function normalizeToken(str) {
  if (typeof str !== "string") return "";
  return str.replace(/\s+/g, "").trim();
}

/**
 * Get Instagram credentials for Graph API posting (to post video to connected account).
 * Priority: (1) Env INSTAGRAM_USER_ID + INSTAGRAM_ACCESS_TOKEN if both set; (2) Firestore OAuth.
 * @returns {{ user_id: string, access_token: string, _debug?: object } | null}
 */
export async function getInstagramCredentials() {
  LOG({ step: "getCredentials", action: "start" });

  // Manual env override – use when Firestore OAuth tokens fail (e.g. "Cannot parse access token")
  const envUserId = typeof process.env.INSTAGRAM_USER_ID === "string" ? process.env.INSTAGRAM_USER_ID.trim() : "";
  const envToken = normalizeToken(process.env.INSTAGRAM_ACCESS_TOKEN || "");
  if (envUserId && envToken) {
    LOG({ step: "getCredentials", outcome: "return_creds", source: "env", user_id_length: envUserId.length, access_token_length: envToken.length });
    return {
      user_id: envUserId,
      access_token: envToken,
      _debug: buildDebug("env", envUserId, envToken),
    };
  }

  const db = getAdminDb();
  const ref = db.collection("integrations").doc(INTEGRATIONS_DOC);
  const snap = await ref.get();

  if (!snap.exists) {
    LOG({ step: "getCredentials", outcome: "no_doc", reason: "integrations/instagram missing" });
    return null;
  }

  const data = snap.data();
  let accessToken = data.access_token;
  const userId = data.user_id;
  LOG({
    step: "getCredentials",
    action: "read_firestore",
    firestore_raw: {
      access_token_type: typeof data.access_token,
      access_token_length: typeof data.access_token === "string" ? data.access_token.length : 0,
      user_id_type: typeof data.user_id,
      user_id_length: typeof data.user_id === "string" ? data.user_id.length : 0,
    },
  });

  if (typeof accessToken !== "string") accessToken = accessToken?.accessToken ?? "";
  accessToken = normalizeToken(accessToken || "");
  const userIdStr = typeof userId === "string" ? userId.trim() : "";
  if (!userIdStr) accessToken = "";
  const firestoreDebug = {
    ...buildDebug("firestore", userIdStr, accessToken),
    firestore_raw_token_type: typeof data.access_token,
  };
  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0;
  const now = Date.now();
  const refreshThreshold = REFRESH_IF_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;
  const needsRefresh = expiresAt && expiresAt - now < refreshThreshold;

  if (needsRefresh) {
    LOG({ step: "getCredentials", action: "refresh_attempt", expiresAt: !!expiresAt, now });
    try {
      const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
      if (!clientSecret) {
        LOG({ step: "getCredentials", action: "refresh_skip", reason: "no INSTAGRAM_CLIENT_SECRET" });
      } else {
        const { InstagramOAuthSdk } = await import("@microfox/instagram-oauth");
        const sdk = new InstagramOAuthSdk({
          clientId: process.env.INSTAGRAM_CLIENT_ID || "",
          clientSecret,
          redirectUri: "",
        });
        const refreshed = await sdk.refreshToken(accessToken);
        accessToken = normalizeToken(refreshed?.accessToken ?? "");
        const newExpiresAt = new Date(now + refreshed.expiresIn * 1000).toISOString();
        await ref.update({
          access_token: accessToken,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        });
        LOG({
          step: "getCredentials",
          action: "refresh_ok",
          new_token_length: accessToken.length,
          expiresIn: refreshed.expiresIn,
        });
      }
    } catch (e) {
      LOG({
        step: "getCredentials",
        action: "refresh_error",
        error: e.message,
        code: e.code,
      });
      console.warn("[Instagram] token refresh failed:", e.message);
    }
  }

  if (userIdStr && accessToken) {
    LOG({
      step: "getCredentials",
      outcome: "return_creds",
      source: "firestore",
      user_id_length: userIdStr.length,
      access_token_length: accessToken.length,
    });
    return { user_id: userIdStr, access_token: accessToken, _debug: firestoreDebug };
  }

  LOG({
    step: "getCredentials",
    outcome: "return_null",
    reason: "invalid_doc",
    hasUserId: !!userIdStr,
    hasToken: !!accessToken,
    user_id_length: userIdStr.length,
    access_token_length: accessToken.length,
  });
  return null;
}
