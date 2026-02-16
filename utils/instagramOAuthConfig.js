/**
 * Single place to build Instagram OAuth redirect_uri so it matches exactly in both
 * /api/auth/instagram and /api/auth/instagram/callback (Meta requires exact match).
 */
export function getInstagramRedirectUri() {
  if (process.env.INSTAGRAM_REDIRECT_URI) {
    const uri = process.env.INSTAGRAM_REDIRECT_URI.replace(/\/+$/, "");
    console.log("[Instagram OAuth] redirect_uri from INSTAGRAM_REDIRECT_URI:", uri);
    return uri;
  }
  const base = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const baseUrl = (base || "").replace(/\/+$/, "");
  const uri = `${baseUrl}/api/auth/instagram/callback`;
  console.log("[Instagram OAuth] redirect_uri from base URL:", uri, "| NEXT_PUBLIC_BASE_URL:", process.env.NEXT_PUBLIC_BASE_URL ? "(set)" : "(unset)", "| VERCEL_URL:", process.env.VERCEL_URL ? "(set)" : "(unset)");
  return uri;
}
