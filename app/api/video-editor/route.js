import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.topic || !data.script || !data.scenes) {
      return NextResponse.json(
        { error: "Missing required fields: topic, script, or scenes" },
        { status: 400 }
      );
    }

    // Generate session ID
    const sessionId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store in Firestore
    const db = getAdminDb();
    const sessionData = {
      session_id: sessionId,
      topic: data.topic,
      script: data.script,
      selected_character: data.selected_character || {},
      voiceover_url: data.voiceover_url || null,
      status: "pending_approval",
      scenes: data.scenes.map((scene) => ({
        id: scene.id,
        duration: scene.duration,
        location: scene.location,
        voiceover: scene.voiceover,
        camera: scene.camera,
        mood: scene.mood,
        image_prompt: scene.image_prompt,
        motion_prompt: scene.motion_prompt,
        image_url: scene.image_url || null,
        video_url: null,
        approved: false,
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.collection("video_sessions").doc(sessionId).set(sessionData);

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      editor_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/admin/video-editor?session=${sessionId}`,
    });
  } catch (error) {
    console.error("Video editor API error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve session data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session parameter" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const doc = await db.collection("video_sessions").doc(sessionId).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: doc.data(),
    });
  } catch (error) {
    console.error("Video editor GET error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

// PATCH endpoint to update scene approval status
export async function PATCH(request) {
  try {
    const data = await request.json();
    const { session_id, scene_id, approved, image_url } = data;

    if (!session_id || scene_id === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: session_id or scene_id" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const docRef = db.collection("video_sessions").doc(session_id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const sessionData = doc.data();
    const sceneIndex = sessionData.scenes.findIndex((s) => s.id === scene_id);

    if (sceneIndex === -1) {
      return NextResponse.json(
        { error: "Scene not found" },
        { status: 404 }
      );
    }

    // Update scene
    sessionData.scenes[sceneIndex].approved = approved !== undefined ? approved : sessionData.scenes[sceneIndex].approved;
    if (image_url) {
      sessionData.scenes[sceneIndex].image_url = image_url;
    }
    sessionData.updated_at = new Date().toISOString();

    await docRef.update({
      scenes: sessionData.scenes,
      updated_at: sessionData.updated_at,
    });

    return NextResponse.json({
      success: true,
      data: sessionData,
    });
  } catch (error) {
    console.error("Video editor PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
