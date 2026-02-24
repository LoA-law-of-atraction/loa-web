import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

const COLLECTION = "quote_projects";

/** POST - Set project's music from the music collection (same as video-generator/select-music but updates quote_projects). */
export async function POST(request) {
  try {
    const { project_id, music_id } = await request.json();

    if (!project_id || !music_id) {
      return NextResponse.json(
        { error: "Missing project_id or music_id" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const musicDoc = await db.collection("music").doc(music_id).get();
    if (!musicDoc.exists) {
      return NextResponse.json({ error: "Music not found" }, { status: 404 });
    }

    const data = musicDoc.data();
    if (data.project_id !== project_id) {
      return NextResponse.json(
        { error: "Music does not belong to this project" },
        { status: 403 }
      );
    }

    const musicUrl = data.music_url;
    const prompt = data.prompt || "";
    const compositionPlan = data.composition_plan;
    const descriptionForStorage = compositionPlan
      ? JSON.stringify(compositionPlan)
      : prompt;

    const projectRef = db.collection(COLLECTION).doc(project_id);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await projectRef.update({
      background_music_id: music_id,
      music_url: musicUrl,
      background_music_prompt: descriptionForStorage,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      music_url: musicUrl,
      background_music_prompt: descriptionForStorage,
    });
  } catch (error) {
    console.error("Quote select-music error:", error);
    return NextResponse.json(
      { error: "Failed to select music", message: error?.message || String(error) },
      { status: 500 }
    );
  }
}
