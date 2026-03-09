import { NextResponse } from "next/server";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/avif",
];

function isImageContentType(ct) {
  if (!ct || typeof ct !== "string") return false;
  const normalized = ct.split(";")[0].trim().toLowerCase();
  return IMAGE_TYPES.some((t) => normalized === t || normalized.startsWith("image/"));
}

/** Returns true if URL is a Pinterest page (pin.it or pinterest.com/...). */
function isPinterestPageUrl(url) {
  if (!url || typeof url !== "string") return false;
  const u = url.trim().toLowerCase();
  return u.includes("pin.it/") || u.includes("pinterest.com/");
}

/** Extract og:image URL from HTML. */
function extractOgImageUrl(html) {
  if (!html || typeof html !== "string") return null;
  const patterns = [
    /property=["']og:image["']\s+content=["']([^"']+)["']/i,
    /content=["']([^"']+)["']\s+property=["']og:image["']/i,
    /"og:image"\s*,\s*"content"\s*:\s*"([^"]+)"/,
    /"content"\s*:\s*"([^"]+)"[^}]*"og:image"/,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) {
      const url = m[1].trim();
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
    }
  }
  return null;
}

/** Extract any i.pinimg.com image URL from HTML (regex fallback). */
function extractPinimgUrlFromHtml(html) {
  if (!html || typeof html !== "string") return null;
  const seen = new Set();
  const byRes = { originals: [] };
  byRes["736x"] = [];
  byRes["564x"] = [];
  byRes["236x"] = [];
  let m;
  const re = /https:\/\/i\.pinimg\.com\/(originals|736x|564x|236x)\/[^\s"']+\.(jpg|jpeg|png|webp|gif)/gi;
  while ((m = re.exec(html)) !== null) {
    const url = m[0].replace(/[)"'>\s].*$/, "").trim();
    if (seen.has(url)) continue;
    seen.add(url);
    const res = (m[1] || "").toLowerCase();
    if (byRes[res]) byRes[res].push(url);
  }
  const pick = (arr) => (arr && arr.length ? arr[0] : null);
  let found = pick(byRes.originals) || pick(byRes["736x"]) || pick(byRes["564x"]) || pick(byRes["236x"]);
  if (found) return found;
  const anyPinimg = /https:\/\/i\.pinimg\.com\/[^\s"']+\.(jpg|jpeg|png|webp|gif)/i.exec(html);
  return anyPinimg ? anyPinimg[0].replace(/[)"'>\s].*$/, "").trim() : null;
}

/** Extract image URL from __PWS_INITIAL_PROPS__ JSON. */
function extractImageFromPwsProps(html) {
  if (!html || typeof html !== "string") return null;
  const scriptMatch = html.match(/<script[^>]*id=["']__PWS_INITIAL_PROPS__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!scriptMatch || !scriptMatch[1]) return null;
  try {
    const data = JSON.parse(scriptMatch[1]);
    const pinimgRe = /https:\/\/i\.pinimg\.com\/[^\s"']+\.(jpg|jpeg|png|webp|gif)/i;
    function findUrl(obj) {
      if (typeof obj === "string" && pinimgRe.test(obj)) return obj;
      if (Array.isArray(obj)) {
        for (const v of obj) { const u = findUrl(v); if (u) return u; }
        return null;
      }
      if (obj && typeof obj === "object") {
        for (const v of Object.values(obj)) { const u = findUrl(v); if (u) return u; }
        return null;
      }
      return null;
    }
    return findUrl(data);
  } catch {
    return null;
  }
}

/** Resolve Pinterest page HTML to a direct image URL. Tries og:image, then i.pinimg.com regex, then __PWS_INITIAL_PROPS__. */
function resolvePinterestPageToImageUrl(html) {
  return extractOgImageUrl(html) || extractPinimgUrlFromHtml(html) || extractImageFromPwsProps(html);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let imageUrl = searchParams.get("url");
    const filename = searchParams.get("filename") || "image.png";

    console.log("[download-image] Request url param:", imageUrl ? `${String(imageUrl).slice(0, 120)}` : imageUrl);

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "Missing image URL" },
        { status: 400 }
      );
    }

    let trimmed = imageUrl.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return NextResponse.json(
        { error: "URL must be http or https" },
        { status: 400 }
      );
    }

    // If it's a Pinterest page link, resolve to the actual image URL via og:image
    if (isPinterestPageUrl(trimmed)) {
      console.log("[download-image] Pinterest page detected, resolving og:image...");
      try {
        const pageRes = await fetch(trimmed, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
          redirect: "follow",
          signal: AbortSignal.timeout(12000),
        });
        if (!pageRes.ok) {
          console.log("[download-image] Pinterest page fetch failed:", pageRes.status);
          return NextResponse.json(
            { error: "Could not load Pinterest page.", hint: "Try using the direct image URL: on Pinterest, right-click the image → Copy image address." },
            { status: 400 }
          );
        }
        const html = await pageRes.text();
        const resolvedUrl = resolvePinterestPageToImageUrl(html);
        if (resolvedUrl) {
          console.log("[download-image] Resolved Pinterest image URL:", resolvedUrl.slice(0, 80));
          trimmed = resolvedUrl;
        } else {
          console.log("[download-image] No image URL found in Pinterest page (tried og:image, i.pinimg.com regex, __PWS_INITIAL_PROPS__)");
          return NextResponse.json(
            { error: "Could not find image in this Pinterest link.", hint: "Try opening the pin, right-click the image, and use Copy image address (the URL usually starts with i.pinimg.com)." },
            { status: 400 }
          );
        }
      } catch (e) {
        console.error("[download-image] Pinterest resolve error:", e?.message);
        return NextResponse.json(
          { error: "Could not load Pinterest page.", hint: "Use the direct image URL: right-click the image on Pinterest → Copy image address." },
          { status: 400 }
        );
      }
    }

    console.log("[download-image] Fetching image:", trimmed.slice(0, 100));
    const response = await fetch(trimmed, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LoA-Web/1.0)" },
      signal: AbortSignal.timeout(15000),
    });

    const responseContentType = response.headers.get("content-type") || "";
    console.log("[download-image] Response status:", response.status, response.statusText, "content-type:", responseContentType);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log("[download-image] Blob size:", blob.size, "type:", blob.type);

    if (!isImageContentType(blob.type) && !isImageContentType(responseContentType)) {
      console.log("[download-image] Rejected: not an image (got " + (blob.type || responseContentType) + ")");
      return NextResponse.json(
        {
          error: "URL must point to a direct image file.",
          hint: "Pinterest pin links (pin.it or pinterest.com/pin/...) open a page, not the image. On Pinterest, right-click the image and choose \"Copy image address\" (or \"Copy image link\"), then paste that URL here. It usually starts with i.pinimg.com.",
        },
        { status: 400 }
      );
    }

    if (blob.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "Image too large (max 10MB)" },
        { status: 400 }
      );
    }

    const contentType = blob.type && isImageContentType(blob.type)
      ? blob.type
      : responseContentType && isImageContentType(responseContentType)
        ? responseContentType.split(";")[0].trim()
        : "image/png";
    console.log("[download-image] Returning image contentType:", contentType);

    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[download-image] Error:", error?.message, error);
    return NextResponse.json(
      { error: "Failed to download image", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
