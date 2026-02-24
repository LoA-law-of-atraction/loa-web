import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

const COLLECTION = "quote_projects";
const SESSION_COLLECTION = "video_sessions";

/**
 * GET ?project_id=xxx
 * If project is rendering, polls Shotstack for status and updates Firestore when done.
 * Returns { status, final_video_url }.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get("project_id");

    if (!project_id) {
      return NextResponse.json(
        { error: "Missing project_id" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const projectRef = db.collection(COLLECTION).doc(project_id);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const data = projectDoc.data();
    const status = data.status || "draft";
    const renderId = data.shotstack_render_id;
    let finalVideoUrl = data.final_video_url || null;

    if (status === "rendering" && renderId) {
      const res = await fetch(
        `https://api.shotstack.io/edit/v1/render/${renderId}`,
        {
          headers: { "x-api-key": process.env.SHOTSTACK_API_KEY },
        }
      );
      if (res.ok) {
        const result = await res.json();
        const renderStatus = result.response?.status;
        if (renderStatus === "done") {
          finalVideoUrl = result.response?.url || null;
          const now = new Date().toISOString();
          await projectRef.update({
            status: "completed",
            final_video_url: finalVideoUrl,
            updated_at: now,
          });
          await db.collection(SESSION_COLLECTION).doc(project_id).set(
            {
              session_id: project_id,
              status: "completed",
              final_video_url: finalVideoUrl,
              updated_at: now,
            },
            { merge: true }
          );
          return NextResponse.json({
            success: true,
            status: "completed",
            final_video_url: finalVideoUrl,
          });
        }
        if (renderStatus === "failed") {
          const now = new Date().toISOString();
          const renderError =
            result.response?.error ||
            result.response?.message ||
            result.error ||
            null;
          await projectRef.update({
            status: "failed",
            render_error: renderError || null,
            updated_at: now,
          });
          await db.collection(SESSION_COLLECTION).doc(project_id).update({
            status: "failed",
            updated_at: now,
          });
          return NextResponse.json({
            success: true,
            status: "failed",
            final_video_url: null,
            render_error: renderError,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      status,
      final_video_url: finalVideoUrl,
    });
  } catch (error) {
    console.error("Quote render status error:", error);
    return NextResponse.json(
      { error: "Failed to get status", message: error.message },
      { status: 500 }
    );
  }
}

/** DELETE ?project_id=xxx - Clear rendered video (same as character shorts flow). */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get("project_id");
    if (!project_id) {
      return NextResponse.json({ error: "Missing project_id" }, { status: 400 });
    }
    const db = getAdminDb();
    const now = new Date().toISOString();
    await db.collection(COLLECTION).doc(project_id).update({
      final_video_url: null,
      updated_at: now,
    });
    await db.collection(SESSION_COLLECTION).doc(project_id).set(
      { session_id: project_id, final_video_url: null, updated_at: now },
      { merge: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quote render-status DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to clear render", message: error.message },
      { status: 500 }
    );
  }
}
