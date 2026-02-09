import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const { project_id, session_id, voiceover_id } = await request.json();

    if (!project_id || !voiceover_id) {
      return NextResponse.json(
        { error: "Missing required fields: project_id, voiceover_id" },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const voiceoverDoc = await db.collection("voiceovers").doc(voiceover_id).get();
    if (!voiceoverDoc.exists) {
      return NextResponse.json(
        { error: "Voiceover not found" },
        { status: 404 },
      );
    }

    const data = voiceoverDoc.data();
    const voiceoverUrl = data.voiceover_url;

    if (!voiceoverUrl) {
      return NextResponse.json(
        { error: "Voiceover URL missing" },
        { status: 400 },
      );
    }

    // Update project document
    const projectRef = db.collection("projects").doc(project_id);
    const projectDoc = await projectRef.get();
    if (projectDoc.exists) {
      await projectRef.update({
        voiceover_id,
        voiceover_url: voiceoverUrl,
        updated_at: new Date().toISOString(),
      });
    }

    // Update video_sessions for backward compatibility
    if (session_id) {
      await db.collection("video_sessions").doc(session_id).set(
        {
          voiceover_url: voiceoverUrl,
          updated_at: new Date().toISOString(),
        },
        { merge: true },
      );
    }

    return NextResponse.json({
      success: true,
      voiceover_url: voiceoverUrl,
    });
  } catch (error) {
    console.error("Select voiceover error:", error);
    return NextResponse.json(
      { error: "Failed to select voiceover", message: error.message },
      { status: 500 },
    );
  }
}
