import { NextResponse } from "next/server";
import { fetchTranscript } from "youtube-transcript-plus";

/**
 * POST /api/quote-videos/youtube-transcript
 * Body: { url: "https://www.youtube.com/watch?v=..." } or { videoId: "dQw4w9WgXcQ" }
 * Returns: { success, transcript: string, segments: { text, offset, duration }[] }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const url = (body.url || body.videoId || "").trim();
    if (!url) {
      return NextResponse.json(
        { success: false, error: "Missing url or videoId" },
        { status: 400 }
      );
    }

    const segments = await fetchTranscript(url);
    const decode = (s) =>
      String(s)
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    const transcript = segments
      .map((s) => decode(s.text))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return NextResponse.json({
      success: true,
      transcript,
      segments: segments.map(({ text, offset, duration }) => ({ text, offset, duration })),
    });
  } catch (error) {
    const message = error.message || String(error);
    if (message.includes("Transcript is disabled") || message.includes("disabled")) {
      return NextResponse.json(
        { success: false, error: "Transcript is disabled for this video." },
        { status: 400 }
      );
    }
    if (message.includes("Video unavailable") || message.includes("unavailable")) {
      return NextResponse.json(
        { success: false, error: "Video is unavailable or private." },
        { status: 400 }
      );
    }
    if (message.includes("Invalid") || message.includes("video ID") || message.includes("videoId")) {
      return NextResponse.json(
        { success: false, error: "Invalid YouTube URL or video ID." },
        { status: 400 }
      );
    }
    if (message.includes("too many requests") || message.includes("captcha")) {
      return NextResponse.json(
        { success: false, error: "YouTube is rate-limiting. Try again in a few minutes." },
        { status: 429 }
      );
    }
    if (message.includes("No transcript") || message.includes("not available")) {
      return NextResponse.json(
        { success: false, error: "No transcript available for this video." },
        { status: 400 }
      );
    }
    console.error("YouTube transcript error:", error);
    return NextResponse.json(
      { success: false, error: message || "Failed to fetch transcript." },
      { status: 500 }
    );
  }
}
