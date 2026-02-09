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
      .collection("voiceovers")
      .orderBy("timestamp", "desc")
      .limit(fetchLimit)
      .get();

    let docs = snapshot.docs;
    if (projectId) {
      docs = docs.filter((d) => d.data().project_id === projectId).slice(0, limit);
    } else {
      docs = docs.slice(0, limit);
    }
    const voiceovers = docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        voiceover_url: d.voiceover_url || null,
        storage_path: d.storage_path || null,
        project_id: d.project_id || null,
        session_id: d.session_id || null,
        character_id: d.character_id || null,
        character_name: d.character_name || null,
        script_length: d.script_length || null,
        cost: d.cost ?? null,
        timestamp: d.timestamp || null,
      };
    });

    return NextResponse.json({
      success: true,
      voiceovers,
    });
  } catch (error) {
    console.error("Voiceover list error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list voiceovers", message: error.message },
      { status: 500 },
    );
  }
}
