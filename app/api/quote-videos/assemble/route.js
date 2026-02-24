import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { calculateShotstackCost } from "@/utils/costCalculator";

const COLLECTION = "quote_projects";
const SESSION_COLLECTION = "video_sessions";

/** Map TimelineEditor font value to Shotstack rich-text font family (must match TimelineEditor SUBTITLE_FONT_OPTIONS). */
const SUBTITLE_FONT_TO_SHOTSTACK = {
  sans: "Clear Sans",
  serif: "Arapey Regular",
  mono: "Roboto",
  montserrat: "Montserrat",
  openSans: "Open Sans",
  workSans: "Work Sans",
  didact: "Didact Gothic",
  permanentMarker: "Permanent Marker",
  sueEllen: "Sue Ellen Francisco",
  uniNeue: "Uni Neue",
};
function getQuoteFontFamily(value) {
  return SUBTITLE_FONT_TO_SHOTSTACK[value] || "Clear Sans";
}

/**
 * Build Shotstack timeline: text overlay (quote) on top, optional grain overlay, animation video behind, optional music.
 * Tracks order: first = top layer (text), then grain if set, then video, then audio.
 * Single-video variant.
 */
function buildQuoteTimeline(quoteText, animationVideoUrl, musicUrl, durationSeconds, options = {}) {
  const duration = Math.max(5, Math.min(60, Number(durationSeconds) || 15));
  const videoClips = [
    {
      asset: { type: "video", src: animationVideoUrl },
      start: 0,
      length: duration,
      fit: "cover",
    },
  ];
  return buildQuoteTimelineWithVideoClips(quoteText, videoClips, duration, musicUrl, options);
}

/**
 * Build Shotstack timeline with multiple video clips (one per scene). Quote text and grain span full duration.
 * Uses selected_video_url (or video_url) and duration (or duration_seconds) per scene.
 */
function buildQuoteTimelineFromScenes(quoteText, scenes, musicUrl, options = {}) {
  if (!scenes?.length) return null;
  let start = 0;
  const withResolved = scenes.map((s, i) => {
    const url = (s.selected_video_url || s.video_url || "").trim();
    const dur = Math.max(1, Math.min(60, Number(s.duration ?? s.duration_seconds) || 8));
    if (i < 5) console.log(`[QuoteVideos Assemble] buildQuoteTimelineFromScenes scene[${i}]: url=${url ? url.slice(0, 50) + "…" : "(empty)"} dur=${dur}`);
    return { url, dur };
  });
  const videoClips = withResolved
    .filter(({ url }) => url)
    .map(({ url, dur }) => {
      const clip = {
        asset: { type: "video", src: url },
        start,
        length: dur,
        fit: "cover",
      };
      start += dur;
      return clip;
    });
  if (withResolved.length !== videoClips.length) {
    console.log("[QuoteVideos Assemble] buildQuoteTimelineFromScenes: dropped", withResolved.length - videoClips.length, "scenes (no url)");
  }
  if (!videoClips.length) {
    console.log("[QuoteVideos Assemble] buildQuoteTimelineFromScenes: no video clips, returning null");
    return null;
  }
  const duration = start;
  return buildQuoteTimelineWithVideoClips(quoteText, videoClips, duration, musicUrl, options);
}

function buildQuoteTimelineWithVideoClips(quoteText, videoClips, duration, musicUrl, options = {}) {
  const grainOverlayUrl = options.grain_overlay_url && String(options.grain_overlay_url).trim();
  // Cap at 60% so grain never fully obscures the video
  const grainOpacity = Math.min(
    0.6,
    Math.max(0, Math.min(1, Number(options.grain_opacity) || 0.2)),
  );
  const subtitleFont = options.subtitle_font ?? "sans";
  const subtitleFontSize = Number(options.subtitle_font_size);
  const subtitleTextColor = options.subtitle_text_color;
  const fontFamily = getQuoteFontFamily(subtitleFont);
  const fontSizePx = Number.isFinite(subtitleFontSize)
    ? Math.max(24, Math.min(96, Math.round(subtitleFontSize * 4)))
    : 52;
  const fontColor = /^#[0-9A-Fa-f]{6}$/.test(String(subtitleTextColor))
    ? String(subtitleTextColor)
    : "#FFFFFF";
  const subtitleStroke = options.subtitle_stroke === true;
  const subtitleShadow = options.subtitle_shadow !== false;
  const shadowStrength = Math.max(0, Math.min(100, Number(options.subtitle_shadow_strength) ?? 85));
  const shadowOpacity = 0.4 + (shadowStrength / 100) * 0.55;
  const shadowBlur = 2 + (shadowStrength / 100) * 12;

  const quoteAsset = {
    type: "rich-text",
    text: quoteText,
    font: { family: fontFamily, size: fontSizePx, color: fontColor },
    align: { horizontal: "center", vertical: "middle" },
    background: { color: "#000000", opacity: 0.4 },
    padding: 24,
  };
  if (subtitleShadow && shadowStrength > 0) {
    quoteAsset.shadow = {
      offsetX: 2,
      offsetY: 2,
      blur: Math.round(shadowBlur),
      color: "#000000",
      opacity: shadowOpacity,
    };
  }
  if (subtitleStroke) {
    quoteAsset.stroke = { width: 2, color: "#000000", opacity: 1 };
  }

  const quotePosition = ["top", "bottom", "center"].includes(String(options.subtitle_position || "").toLowerCase())
    ? String(options.subtitle_position).toLowerCase()
    : "center";

  const tracks = [
    // Track 0: Quote text (top layer); clip position from timeline_settings.subtitlePosition
    {
      clips: [
        {
          asset: quoteAsset,
          start: 0,
          length: duration,
          width: 1000,
          position: quotePosition,
        },
      ],
    },
  ];

  const isPublicGrainUrl =
    grainOverlayUrl &&
    /^https:\/\//i.test(grainOverlayUrl) &&
    !/^https?:\/\/localhost(\d*)(\/|$)/i.test(grainOverlayUrl);
  if (isPublicGrainUrl) {
    tracks.push({
      clips: [
        {
          asset: {
            type: /\.(mp4|webm|mov)(\?|$)/i.test(grainOverlayUrl) ? "video" : "image",
            src: grainOverlayUrl,
          },
          start: 0,
          length: duration,
          fit: "cover",
          position: "center",
          opacity: grainOpacity,
        },
      ],
    });
  }

  const videoFilter = options.video_filter === "darken" ? "darken" : "none";
  const videoOpacity = Number.isFinite(Number(options.video_opacity))
    ? Math.max(0.2, Math.min(1, Number(options.video_opacity)))
    : 1;
  const videoClipsWithEffect = videoClips.map((c) => ({
    ...c,
    ...(videoFilter !== "none" ? { filter: videoFilter } : {}),
    ...(videoOpacity < 1 ? { opacity: videoOpacity } : {}),
  }));

  tracks.push({ clips: videoClipsWithEffect });

  if (musicUrl) {
    tracks.push({
      clips: [
        {
          asset: {
            type: "audio",
            src: musicUrl,
            volume: 0.3,
          },
          start: 0,
          length: "auto",
        },
      ],
    });
  }

  return {
    timeline: {
      tracks,
      soundtrack: musicUrl ? undefined : undefined,
    },
    output: {
      format: "mp4",
      resolution: "hd",
      size: { width: 1080, height: 1920 },
    },
  };
}

/** POST - Assemble quote + video(s) and start Shotstack render. Supports single video or multiple scenes. */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      project_id,
      quote_text,
      animation_video_url,
      scenes: bodyScenes,
      music_url = null,
      duration_seconds = 15,
      grain_overlay_url: bodyGrainUrl = null,
      grain_opacity = 0.2,
      timeline_settings: bodyTimelineSettings = null,
      subtitle_font = null,
      subtitle_font_size = null,
      subtitle_text_color = null,
    } = body;
    const grain_overlay_url = bodyGrainUrl || process.env.QUOTE_VIDEOS_GRAIN_OVERLAY_URL || null;

    if (!project_id || !quote_text?.trim()) {
      return NextResponse.json(
        { error: "Missing project_id or quote_text" },
        { status: 400 }
      );
    }

    const hasScenes =
      Array.isArray(bodyScenes) &&
      bodyScenes.length > 0 &&
      bodyScenes.some((s) => (s.selected_video_url || s.video_url || "").trim());
    // DEBUG: what assemble API received for render
    console.log("[QuoteVideos Assemble] body.scenes count:", bodyScenes?.length ?? 0);
    if (Array.isArray(bodyScenes) && bodyScenes.length > 0) {
      bodyScenes.forEach((s, i) => {
        const sel = (s.selected_video_url || "").trim();
        const vid = (s.video_url || "").trim();
        const dur = s.duration ?? s.duration_seconds;
        console.log(`[QuoteVideos Assemble] scene[${i}] selected_video_url: ${sel ? sel.slice(0, 60) + (sel.length > 60 ? "…" : "") : "(empty)"}, video_url: ${vid ? vid.slice(0, 60) + (vid.length > 60 ? "…" : "") : "(empty)"}, duration: ${dur}`);
      });
    }
    console.log("[QuoteVideos Assemble] hasScenes:", hasScenes, "animation_video_url:", (animation_video_url || "").slice(0, 60) + ((animation_video_url || "").length > 60 ? "…" : ""));
    if (!hasScenes && (!animation_video_url || !animation_video_url.trim())) {
      return NextResponse.json(
        { error: "Missing animation_video_url or scenes with selected_video_url / video_url" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const projectRef = db.collection(COLLECTION).doc(project_id);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = projectDoc.data() || {};
    const timelineSettings = (bodyTimelineSettings && typeof bodyTimelineSettings === "object" && Object.keys(bodyTimelineSettings).length > 0)
      ? { ...(projectData.timeline_settings || {}), ...bodyTimelineSettings }
      : (projectData.timeline_settings || {});
    const grainOptions = {
      grain_overlay_url: grain_overlay_url || undefined,
      grain_opacity,
      video_filter: timelineSettings.videoFilter === "darken" ? "darken" : "none",
      video_opacity: Number.isFinite(Number(timelineSettings.videoOpacity)) && Number(timelineSettings.videoOpacity) >= 0.2 && Number(timelineSettings.videoOpacity) <= 1
        ? Number(timelineSettings.videoOpacity)
        : 1,
      subtitle_font: subtitle_font ?? timelineSettings.subtitleFont ?? "sans",
      subtitle_font_size: subtitle_font_size ?? timelineSettings.subtitleFontSize ?? 14,
      subtitle_text_color: subtitle_text_color ?? timelineSettings.subtitleTextColor ?? "#FFFFFF",
      subtitle_position: timelineSettings.subtitlePosition ?? "center",
      subtitle_stroke: timelineSettings.subtitleStroke === true,
      subtitle_shadow: timelineSettings.subtitleShadow !== false,
      subtitle_shadow_strength: Number.isFinite(Number(timelineSettings.subtitleShadowStrength)) && Number(timelineSettings.subtitleShadowStrength) >= 0 && Number(timelineSettings.subtitleShadowStrength) <= 100
        ? Number(timelineSettings.subtitleShadowStrength)
        : 85,
    };

    let payload;
    let totalDurationSeconds;
    if (hasScenes) {
      payload = buildQuoteTimelineFromScenes(
        quote_text.trim(),
        bodyScenes,
        music_url || null,
        grainOptions
      );
      const videoTrack = payload?.timeline?.tracks?.find((t) => t.clips?.some((c) => c.asset?.type === "video"));
      console.log("[QuoteVideos Assemble] timeline video clips used:", videoTrack?.clips?.length ?? 0, videoTrack?.clips?.map((c, i) => ({ index: i, src: (c.asset?.src || "").slice(0, 60) + "…", length: c.length })));
      totalDurationSeconds = payload?.timeline?.tracks?.find((t) =>
        t.clips?.some((c) => c.asset?.type === "video")
      )?.clips?.reduce((acc, c) => acc + (Number(c.length) || 0), 0) ?? 15;
    } else {
      totalDurationSeconds = Math.max(5, Math.min(60, Number(duration_seconds) || 15));
      payload = buildQuoteTimeline(
        quote_text.trim(),
        animation_video_url.trim(),
        music_url || null,
        totalDurationSeconds,
        grainOptions
      );
    }
    if (!payload) {
      return NextResponse.json(
        { error: "No valid scenes with selected_video_url or video_url" },
        { status: 400 }
      );
    }

    const shotstackResponse = await fetch(
      "https://api.shotstack.io/edit/v1/render",
      {
        method: "POST",
        headers: {
          "x-api-key": process.env.SHOTSTACK_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!shotstackResponse.ok) {
      const errText = await shotstackResponse.text();
      throw new Error(`Shotstack API error: ${errText}`);
    }

    const shotstackResult = await shotstackResponse.json();
    const renderId = shotstackResult.response?.id;

    if (!renderId) {
      throw new Error("Shotstack did not return render id");
    }

    const duration = Math.max(5, Math.min(60, Number(totalDurationSeconds) || 15));
    const shotstackCost = calculateShotstackCost(duration);
    const now = new Date().toISOString();

    const existingCosts = projectDoc.data()?.costs || {};
    const step5 = existingCosts.step5 || {};
    const newStep5Shotstack = (step5.shotstack || 0) + shotstackCost;
    const newStep5Total = (step5.total || 0) + shotstackCost;
    const newTotal = (existingCosts.total || 0) + shotstackCost;

    await projectRef.update({
      shotstack_render_id: renderId,
      status: "rendering",
      final_video_url: null,
      updated_at: now,
      costs: {
        ...existingCosts,
        step5: { ...step5, shotstack: newStep5Shotstack, total: newStep5Total },
        total: newTotal,
      },
    });

    // Use project_id as session_id so post-social can find final_video_url
    const sessionRef = db.collection(SESSION_COLLECTION).doc(project_id);
    await sessionRef.set(
      {
        session_id: project_id,
        shotstack_render_id: renderId,
        status: "rendering",
        final_video_url: null,
        updated_at: now,
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      render_id: renderId,
      cost: shotstackCost,
      message: "Render started. Poll project status or use the status endpoint to get the final video URL.",
    });
  } catch (error) {
    const message = error?.message ?? "Failed to assemble";
    console.error("Quote assemble error:", error);
    return NextResponse.json(
      { error: "Failed to assemble", message },
      { status: 500 }
    );
  }
}
