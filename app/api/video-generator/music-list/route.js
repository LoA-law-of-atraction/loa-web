import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("project_id");
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10)),
    );

    const db = getAdminDb();
    const fetchLimit = projectId ? Math.min(200, limit * 5) : limit;
    const snapshot = await db
      .collection("music")
      .orderBy("timestamp", "desc")
      .limit(fetchLimit)
      .get();

    let docs = snapshot.docs;
    if (projectId) {
      docs = docs.filter((d) => d.data().project_id === projectId).slice(0, limit);
    } else {
      docs = docs.slice(0, limit);
    }
    const music = docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        music_url: d.music_url || null,
        prompt: d.prompt || null,
        negative_prompt: d.negative_prompt || null,
        composition_plan: d.composition_plan || null,
        duration_ms: d.duration_ms || d.music_length_ms || null,
        timestamp: d.timestamp || null,
        project_id: d.project_id || null,
        model_endpoint: d.model_endpoint || null,
        cost: d.cost ?? null,
        output_format: d.output_format || null,
        storage: d.storage || null,
        fal_response: d.fal_response || null,
      };
    });

    return NextResponse.json({
      success: true,
      music,
    });
  } catch (error) {
    console.error("Music list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list music", message: error.message },
      { status: 500 },
    );
  }
}
