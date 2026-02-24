import { getAdminDb } from "@/utils/firebaseAdmin";

const INTEGRATIONS_DOC = "youtube";
const LOG = (obj) => console.log("[YouTube]", JSON.stringify(obj));

/** Mask token for debug display. */
function tokenPreview(token) {
  if (typeof token !== "string" || !token) return "";
  if (token.length <= 12) return token.slice(0, 4) + "…";
  return token.slice(0, 8) + "…" + token.slice(-4);
}

function buildDebug(source, access_token) {
  const showFull =
    process.env.YOUTUBE_DEBUG_SHOW_TOKEN === "1" ||
    process.env.YOUTUBE_DEBUG_SHOW_TOKEN === "true";
  const out = {
    source,
    access_token_length: typeof access_token === "string" ? access_token.length : 0,
    access_token_preview: tokenPreview(access_token),
  };
  if (showFull && typeof access_token === "string") out.access_token = access_token;
  return out;
}

function normalizeToken(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/[\s\u200B-\u200D\uFEFF\u00AD]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

/**
 * Refresh Google OAuth access token using refresh_token.
 * @returns {{ access_token: string, expires_in: number } | null}
 */
async function refreshGoogleToken(refreshToken, clientId, clientSecret) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    LOG({ step: "refresh", outcome: "error", status: res.status, body: err?.slice(0, 200) });
    return null;
  }
  const data = await res.json();
  const accessToken = normalizeToken(data.access_token || "");
  const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600;
  return { access_token: accessToken, expires_in: expiresIn };
}

/**
 * Get YouTube credentials for Data API v3 upload.
 * Priority: (1) Env YOUTUBE_ACCESS_TOKEN if set; (2) Firestore OAuth (with refresh).
 * @returns {{ access_token: string, _debug?: object } | null}
 */
export async function getYouTubeCredentials() {
  LOG({ step: "getCredentials", action: "start" });

  const envToken = normalizeToken(process.env.YOUTUBE_ACCESS_TOKEN || "");
  if (envToken) {
    LOG({
      step: "getCredentials",
      outcome: "return_creds",
      source: "env",
      access_token_length: envToken.length,
    });
    return {
      access_token: envToken,
      _debug: buildDebug("env", envToken),
    };
  }

  const db = getAdminDb();
  const ref = db.collection("integrations").doc(INTEGRATIONS_DOC);
  const snap = await ref.get();

  if (!snap.exists) {
    LOG({ step: "getCredentials", outcome: "no_doc", reason: "integrations/youtube missing" });
    return null;
  }

  const data = snap.data();
  let accessToken = normalizeToken(data.access_token || "");
  const refreshToken = typeof data.refresh_token === "string" ? data.refresh_token.trim() : "";
  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0;
  const now = Date.now();
  const bufferSec = 5 * 60; // refresh 5 min before expiry
  const needsRefresh = !accessToken || (expiresAt && expiresAt - now < bufferSec * 1000);

  if (needsRefresh && refreshToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
    const clientSecret =
      process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET;
    if (clientId && clientSecret) {
      try {
        const refreshed = await refreshGoogleToken(refreshToken, clientId, clientSecret);
        if (refreshed?.access_token) {
          accessToken = refreshed.access_token;
          const newExpiresAt = new Date(now + refreshed.expires_in * 1000).toISOString();
          await ref.update({
            access_token: accessToken,
            expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          });
          LOG({
            step: "getCredentials",
            action: "refresh_ok",
            new_token_length: accessToken.length,
          });
        }
      } catch (e) {
        LOG({ step: "getCredentials", action: "refresh_error", error: e.message });
      }
    }
  }

  if (accessToken) {
    LOG({
      step: "getCredentials",
      outcome: "return_creds",
      source: "firestore",
      access_token_length: accessToken.length,
    });
    return {
      access_token: accessToken,
      _debug: buildDebug("firestore", accessToken),
    };
  }

  LOG({
    step: "getCredentials",
    outcome: "return_null",
    reason: "invalid_doc",
    hasRefresh: !!refreshToken,
  });
  return null;
}
