import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const { project_id, session_id, music_id } = await request.json();

    if (!project_id || !session_id || !music_id) {
      return NextResponse.json(
        { error: "Missing required fields: project_id, session_id, music_id" },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const musicDoc = await db.collection("music").doc(music_id).get();
    if (!musicDoc.exists) {
      return NextResponse.json(
        { error: "Music not found" },
        { status: 404 },
      );
    }

    const data = musicDoc.data();
    const musicUrl = data.music_url;
    const prompt = data.prompt || "";
    const compositionPlan = data.composition_plan;
    const descriptionForStorage = compositionPlan
      ? JSON.stringify(compositionPlan)
      : prompt;

    // Update project document
    const projectRef = db.collection("projects").doc(project_id);
    const projectDoc = await projectRef.get();
    if (projectDoc.exists) {
      await projectRef.update({
        background_music_id: music_id,
        background_music_url: musicUrl,
        background_music_prompt: descriptionForStorage,
        updated_at: new Date().toISOString(),
      });
    }

    // Update video_sessions for backward compatibility
    await db.collection("video_sessions").doc(session_id).set(
      {
        background_music_url: musicUrl,
        background_music_prompt: descriptionForStorage,
        updated_at: new Date().toISOString(),
      },
      { merge: true },
    );

    return NextResponse.json({
      success: true,
      music_url: musicUrl,
      background_music_prompt: descriptionForStorage,
    });
  } catch (error) {
    console.error("Select music error:", error);
    return NextResponse.json(
      { error: "Failed to select music", message: error.message },
      { status: 500 },
    );
  }
}
