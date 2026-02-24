import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

const COLLECTION = "quote_projects";

/** GET - List quote projects (newest first) */
export async function GET() {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection(COLLECTION)
      .orderBy("updated_at", "desc")
      .limit(100)
      .get();

    const projects = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error("Quote projects list error:", error);
    return NextResponse.json(
      { error: "Failed to list projects", message: error.message },
      { status: 500 }
    );
  }
}

/** POST - Create a new quote project */
export async function POST(request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Quote video";

    const db = getAdminDb();
    const now = new Date().toISOString();
    const doc = await db.collection(COLLECTION).add({
      name,
      theme: "",
      quote_text: "",
      quote_list: [],
      animation_video_url: "",
      music_url: null,
      duration_seconds: 15,
      final_video_url: null,
      shotstack_render_id: null,
      status: "draft",
      created_at: now,
      updated_at: now,
    });

    return NextResponse.json({
      success: true,
      project: { id: doc.id, name, status: "draft", created_at: now, updated_at: now },
    });
  } catch (error) {
    console.error("Quote project create error:", error);
    return NextResponse.json(
      { error: "Failed to create project", message: error.message },
      { status: 500 }
    );
  }
}
