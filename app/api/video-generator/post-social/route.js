import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { getInstagramCredentials } from "@/utils/instagramAuth";

const LOG = (o) => console.log("[Instagram]", JSON.stringify(o));
const INSTAGRAM_GRAPH_VERSION = "v21.0";
const INSTAGRAM_CONTAINER_POLL_MS = 3000;
const INSTAGRAM_CONTAINER_POLL_MAX = 60; // ~3 min

export async function POST(request) {
  try {
    const { session_id, platform, video_url, caption, cover_url } = await request.json();

    if (!session_id || !platform || !video_url) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let result = { success: false, post_url: null };

    switch (platform) {
      case "instagram":
        LOG({ step: "post_social", platform: "instagram", session_id: session_id?.slice(0, 12), has_video_url: !!video_url });
        result = await postToInstagram(video_url, caption ?? "", cover_url || null);
        LOG({ step: "post_social", platform: "instagram", result_success: result.success, result_message: result.message?.slice(0, 80) });
        break;
      case "youtube":
        result = await postToYouTube(video_url, caption ?? "");
        break;
      case "tiktok":
        result = await postToTikTok(video_url, caption ?? "");
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    const db = getAdminDb();
    const docRef = db.collection("video_sessions").doc(session_id);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      const posts = data.social_posts || [];
      posts.push({
        platform,
        posted_at: new Date().toISOString(),
        post_url: result.post_url,
        status: result.success ? "posted" : "failed",
      });

      await docRef.update({
        social_posts: posts,
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: result.success,
      post_url: result.post_url,
      message: result.message ?? (result.success ? `Posted to ${platform} successfully` : `Failed to post to ${platform}`),
      ...(result.debug != null && { debug: result.debug }),
    });
  } catch (error) {
    console.error("Post social error:", error);
    return NextResponse.json(
      { error: "Failed to post to social media", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Instagram Graph API: upload by URL only (no download on our side).
 * Credentials from env (INSTAGRAM_USER_ID, INSTAGRAM_ACCESS_TOKEN) or from OAuth (Firestore integrations/instagram).
 * @see getInstagramCredentials, /api/auth/instagram
 */
async function postToInstagram(videoUrl, caption, coverUrl = null) {
  LOG({ step: "post_instagram", action: "start", video_url_length: videoUrl?.length ?? 0, has_cover: !!coverUrl });

  const creds = await getInstagramCredentials();
  const debug = creds?._debug || null;

  if (!creds?.user_id || !creds?.access_token) {
    LOG({
      step: "post_instagram",
      outcome: "no_creds",
      debug: debug || { source: "none", reason: "no credentials" },
    });
    return {
      success: false,
      post_url: null,
      message:
        "Instagram is not connected. Connect via OAuth: open /api/auth/instagram in the browser, or set INSTAGRAM_USER_ID and INSTAGRAM_ACCESS_TOKEN in env.",
      debug: debug || { source: "none", reason: "no credentials" },
    };
  }

  const igUserId = String(creds.user_id ?? "").trim();
  let accessToken = creds.access_token;
  if (typeof accessToken !== "string") accessToken = "";
  accessToken = accessToken.replace(/\s+/g, "").trim();
  if (!igUserId || !accessToken) {
    LOG({
      step: "post_instagram",
      outcome: "invalid_creds",
      user_id_length: igUserId.length,
      access_token_type: typeof creds.access_token,
      debug,
    });
    return {
      success: false,
      post_url: null,
      message:
        "Instagram token is missing or invalid. Disconnect and reconnect Instagram (Connect Instagram account), then try again.",
      debug: debug || { access_token_type: typeof creds.access_token, user_id_length: igUserId.length },
    };
  }

  LOG({
    step: "post_instagram",
    action: "graph_create_start",
    source: debug?.source ?? "unknown",
    ig_user_id_length: igUserId.length,
    access_token_length: accessToken.length,
    graph_url: `${INSTAGRAM_GRAPH_VERSION}/${igUserId}/media`,
  });

  // Use graph.instagram.com – tokens from Instagram Login fail on graph.facebook.com with "Cannot parse access token"
  const baseUrl = `https://graph.instagram.com/${INSTAGRAM_GRAPH_VERSION}`;

  // 1) Create media container (Reels with video_url). access_token as query param (Graph API expects it there).
  const createUrl = `${baseUrl}/${igUserId}/media?access_token=${encodeURIComponent(accessToken)}`;
  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "REELS",
      video_url: videoUrl,
      caption: caption.slice(0, 2200),
      ...(coverUrl && { cover_url: coverUrl }),
    }),
  });

  const createData = await createRes.json();
  if (createData.error) {
    LOG({
      step: "post_instagram",
      outcome: "graph_create_error",
      graph_response: {
        error_code: createData.error.code,
        error_type: createData.error.type,
        error_message: createData.error.message,
        error_subcode: createData.error.error_subcode,
        fbtrace_id: createData.error.fbtrace_id,
      },
      creds_source: debug?.source,
      access_token_length: accessToken.length,
    });
    const msg = createData.error.message || JSON.stringify(createData.error);
    const isTokenError = createData.error.code === 190;
    const suggestion = isTokenError
      ? " Disconnect Instagram (Step 7) and connect again to get a new token, then try posting."
      : "";
    return {
      success: false,
      post_url: null,
      message: `Instagram: ${msg}${suggestion}`,
      debug: {
        ...(debug || {}),
        graph_api_error: {
          code: createData.error.code,
          type: createData.error.type,
          message: createData.error.message,
        },
      },
    };
  }
  const creationId = createData.id;
  if (!creationId) {
    LOG({ step: "post_instagram", outcome: "graph_create_no_id", createData_keys: Object.keys(createData || {}) });
    return { success: false, post_url: null, message: "Instagram: No container id returned." };
  }
  LOG({ step: "post_instagram", action: "graph_create_ok", creation_id: creationId });

  // 2) Poll container status until FINISHED or ERROR
  for (let i = 0; i < INSTAGRAM_CONTAINER_POLL_MAX; i++) {
    await new Promise((r) => setTimeout(r, INSTAGRAM_CONTAINER_POLL_MS));
    const statusRes = await fetch(
      `${baseUrl}/${creationId}?fields=status_code&access_token=${encodeURIComponent(accessToken)}`
    );
    const statusData = await statusRes.json();
    if (statusData.error) {
      LOG({
        step: "post_instagram",
        outcome: "graph_status_error",
        creation_id: creationId,
        error: statusData.error?.message,
        error_code: statusData.error?.code,
      });
      return {
        success: false,
        post_url: null,
        message: `Instagram status check: ${statusData.error.message || "Unknown error"}`,
      };
    }
    const code = statusData.status_code;
    if (code === "FINISHED") break;
    if (code === "ERROR" || code === "EXPIRED") {
      LOG({ step: "post_instagram", outcome: "container_failed", status_code: code, creation_id: creationId });
      return {
        success: false,
        post_url: null,
        message: `Instagram container ${code}. Check video format and URL accessibility.`,
      };
    }
    // IN_PROGRESS or other: keep polling
  }

  LOG({ step: "post_instagram", action: "graph_publish_start", creation_id: creationId });

  // 3) Publish. creation_id and access_token as query params per Meta docs.
  const publishUrl = `${baseUrl}/${igUserId}/media_publish?creation_id=${encodeURIComponent(creationId)}&access_token=${encodeURIComponent(accessToken)}`;
  const publishRes = await fetch(publishUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const publishData = await publishRes.json();
  if (publishData.error) {
    LOG({
      step: "post_instagram",
      outcome: "graph_publish_error",
      error_code: publishData.error?.code,
      error_message: publishData.error?.message,
    });
    return {
      success: false,
      post_url: null,
      message: `Instagram publish: ${publishData.error.message || "Unknown error"}`,
    };
  }
  const mediaId = publishData.id;
  const postUrl = mediaId ? `https://www.instagram.com/reel/${mediaId}/` : null;
  LOG({
    step: "post_instagram",
    outcome: "success",
    media_id: mediaId,
    post_url: postUrl,
  });
  return { success: true, post_url: postUrl, message: "Posted to Instagram." };
}

/**
 * YouTube Data API v3: upload via API only (no manual user download/upload).
 * YouTube does not support "upload from URL"; we must send bytes. We use resumable upload
 * and stream from the source URL in chunks so we never buffer the full file in memory.
 * Env: YOUTUBE_ACCESS_TOKEN (OAuth2 access token with youtube.upload scope).
 */
async function postToYouTube(videoUrl, caption) {
  const accessToken = process.env.YOUTUBE_ACCESS_TOKEN;
  if (!accessToken) {
    return {
      success: false,
      post_url: null,
      message:
        "YouTube posting is not configured. Set YOUTUBE_ACCESS_TOKEN (OAuth2 with youtube.upload scope).",
    };
  }

  const title = (caption || "Video").slice(0, 100);
  const metadata = {
    snippet: {
      title,
      description: (caption || "").slice(0, 5000),
      categoryId: "22",
    },
    status: {
      privacyStatus: "public",
      selfDeclaredMadeForKids: false,
    },
  };

  // Get total size (required for resumable init). Stream in 256KB chunks if size known.
  let totalSize = null;
  const headRes = await fetch(videoUrl, { method: "HEAD" });
  if (headRes.ok) {
    const cl = headRes.headers.get("Content-Length");
    if (cl) totalSize = parseInt(cl, 10);
  }
  if (totalSize == null || !Number.isFinite(totalSize) || totalSize <= 0) {
    const fallback = await uploadYouTubeFallbackBuffer(videoUrl, accessToken, metadata);
    if (!fallback.success) return { success: false, post_url: null, message: fallback.message };
    const postUrl = fallback.videoId ? `https://www.youtube.com/watch?v=${fallback.videoId}` : null;
    return { success: true, post_url: postUrl, message: "Uploaded to YouTube." };
  }

  const uploadUrl = await initYouTubeResumableUpload(accessToken, metadata, totalSize);
  if (!uploadUrl) {
    return { success: false, post_url: null, message: "YouTube: Failed to init resumable upload." };
  }

  const result = await streamUploadToYouTube(videoUrl, uploadUrl, accessToken, totalSize, metadata);
  if (!result.success) {
    return { success: false, post_url: null, message: result.message ?? "YouTube upload failed." };
  }
  const videoId = result.videoId;
  const postUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
  return { success: true, post_url: postUrl, message: "Uploaded to YouTube." };
}

const YOUTUBE_CHUNK_SIZE = 256 * 1024; // 256 KB (required multiple for resumable chunks)

async function initYouTubeResumableUpload(accessToken, metadata, totalSize) {
  const res = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": String(totalSize),
      },
      body: JSON.stringify(metadata),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("YouTube resumable init error:", err);
    return null;
  }
  return res.headers.get("Location");
}

async function streamUploadToYouTube(videoUrl, uploadUrl, accessToken, totalSize, metadata) {
  const getRes = await fetch(videoUrl);
  if (!getRes.ok) {
    return { success: false, videoId: null, message: `Failed to fetch video: ${getRes.status}` };
  }
  const reader = getRes.body?.getReader?.();
  if (!reader) {
    return await uploadYouTubeFallbackBuffer(videoUrl, accessToken, metadata);
  }

  let offset = 0;
  let buffer = [];
  let buffered = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (value?.length) {
      buffer.push(value);
      buffered += value.length;
    }
    const shouldSend = done ? buffered > 0 : buffered >= YOUTUBE_CHUNK_SIZE;
    if (!shouldSend && !done) continue;

    if (buffered > 0) {
      const toSend = Math.min(buffered, done ? buffered : YOUTUBE_CHUNK_SIZE);
      const chunk = new Uint8Array(toSend);
      let filled = 0;
      while (filled < toSend && buffer.length) {
        const b = buffer[0];
        const take = Math.min(b.length, toSend - filled);
        chunk.set(b.subarray(0, take), filled);
        filled += take;
        if (take >= b.length) buffer.shift();
        else buffer[0] = b.subarray(take);
      }
      buffered -= toSend;
      const end = offset + toSend - 1;
      const put = await putYouTubeChunk(uploadUrl, accessToken, chunk, offset, end, totalSize);
      if (put?.id) return { success: true, videoId: put.id, message: null };
      if (put?.error) return { success: false, videoId: null, message: put.error.message || "Upload failed" };
      offset = end + 1;
    }
    if (done) break;
  }
  return { success: false, videoId: null, message: "YouTube upload did not return video id." };
}

async function putYouTubeChunk(uploadUrl, accessToken, body, start, end, total) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "video/mp4",
      "Content-Length": String(body.length),
      "Content-Range": `bytes ${start}-${end}/${total}`,
    },
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 200 || res.status === 201) return data;
  if (res.status === 308) return null; // more chunks to send
  return { error: data.error || { message: `HTTP ${res.status}` } };
}

async function uploadYouTubeFallbackBuffer(videoUrl, accessToken, metadata) {
  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) {
    return { success: false, videoId: null, message: `Failed to fetch video: ${videoRes.status}` };
  }
  const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
  const total = videoBuffer.length;
  const title = (metadata?.snippet?.title || "Video").slice(0, 100);
  const fallbackMetadata = metadata || {
    snippet: { title, description: "", categoryId: "22" },
    status: { privacyStatus: "public", selfDeclaredMadeForKids: false },
  };
  const uploadUrl = await initYouTubeResumableUpload(accessToken, fallbackMetadata, total);
  if (!uploadUrl) {
    return { success: false, videoId: null, message: "YouTube: Failed to init upload." };
  }
  const put = await putYouTubeChunk(uploadUrl, accessToken, videoBuffer, 0, total - 1, total);
  if (put?.id) return { success: true, videoId: put.id, message: null };
  return { success: false, videoId: null, message: put?.error?.message || "YouTube upload failed" };
}

/**
 * TikTok Content Posting API: PULL_FROM_URL sends video to user's inbox (draft).
 * Video URL domain must be verified in TikTok Developer Portal.
 * Env: TIKTOK_ACCESS_TOKEN (user access token with video.upload scope).
 */
async function postToTikTok(videoUrl, caption) {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  if (!accessToken) {
    return {
      success: false,
      post_url: null,
      message:
        "TikTok posting is not configured. Set TIKTOK_ACCESS_TOKEN (with video.upload scope).",
    };
  }

  const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    }),
  });

  const initData = await initRes.json();
  const err = initData.error;
  if (err && err.code !== "ok") {
    const msg = err.message || err.code || JSON.stringify(err);
    return {
      success: false,
      post_url: null,
      message: `TikTok: ${msg}. (For PULL_FROM_URL, verify the video URL domain in TikTok Developer Portal.)`,
    };
  }

  const publishId = initData.data?.publish_id;
  // Inbox uploads go to the user's TikTok inbox; there is no direct post URL until they publish in-app.
  const postUrl = "https://www.tiktok.com/notifications/inbox";
  return {
    success: true,
    post_url: postUrl,
    message: publishId
      ? "Video sent to your TikTok inbox. Open TikTok app to edit and publish."
      : "Video sent to TikTok inbox.",
  };
}
