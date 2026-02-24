/**
 * Single place to build YouTube (Google) OAuth redirect_uri so it matches exactly in both
 * /api/auth/youtube and /api/auth/youtube/callback (Google requires exact match).
 */
export function getYouTubeRedirectUri() {
  if (process.env.YOUTUBE_REDIRECT_URI) {
    const uri = process.env.YOUTUBE_REDIRECT_URI.replace(/\/+$/, "");
    return uri;
  }
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const baseUrl = (base || "").replace(/\/+$/, "");
  return `${baseUrl}/api/auth/youtube/callback`;
}
