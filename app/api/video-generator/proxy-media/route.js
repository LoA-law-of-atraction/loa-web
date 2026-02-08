import { NextResponse } from "next/server";

/**
 * Proxies media (video/audio) from Firebase Storage to avoid CORS when loading
 * in ShotStack Studio canvas. Only allows firebasestorage.googleapis.com URLs.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const parsed = new URL(url);
    if (
      !parsed.hostname.endsWith("firebasestorage.googleapis.com") &&
      !parsed.hostname.endsWith("storage.googleapis.com")
    ) {
      return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
    }

    const res = await fetch(url, {
      headers: {
        Range: request.headers.get("range") || "",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream fetch failed" },
        { status: res.status },
      );
    }

    const contentType = res.headers.get("content-type") || "video/mp4";
    const contentLength = res.headers.get("content-length");
    const contentRange = res.headers.get("content-range");
    const acceptRanges = res.headers.get("accept-ranges") || "bytes";

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    if (contentLength) headers.set("Content-Length", contentLength);
    if (contentRange) headers.set("Content-Range", contentRange);
    headers.set("Accept-Ranges", acceptRanges);
    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(res.body, {
      status: res.status,
      headers,
    });
  } catch (error) {
    console.error("Proxy media error:", error);
    return NextResponse.json(
      { error: "Failed to proxy media" },
      { status: 500 },
    );
  }
}
