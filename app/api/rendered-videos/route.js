import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

/** GET - List rendered videos from projects and quote_projects that have final_video_url */
export async function GET() {
  try {
    const db = getAdminDb();
    const limit = 80;

    const [projectsSnap, quoteSnap] = await Promise.all([
      db
        .collection("projects")
        .orderBy("updated_at", "desc")
        .limit(limit * 2)
        .get(),
      db
        .collection("quote_projects")
        .orderBy("updated_at", "desc")
        .limit(limit * 2)
        .get(),
    ]);

    const items = [];

    projectsSnap.docs.forEach((doc) => {
      const d = doc.data();
      if (d.final_video_url) {
        items.push({
          id: doc.id,
          type: "character",
          final_video_url: d.final_video_url,
          updated_at: d.updated_at,
          name: d.project_name || d.name || "Character Short",
          project_id: doc.id,
        });
      }
    });

    quoteSnap.docs.forEach((doc) => {
      const d = doc.data();
      if (d.final_video_url) {
        items.push({
          id: doc.id,
          type: "quote",
          final_video_url: d.final_video_url,
          updated_at: d.updated_at,
          name: d.name || "Quote video",
          quote_text: d.quote_text,
          project_id: doc.id,
        });
      }
    });

    items.sort((a, b) => {
      const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return tb - ta;
    });

    return NextResponse.json({
      success: true,
      videos: items.slice(0, limit),
    });
  } catch (error) {
    console.error("Rendered videos list error:", error);
    return NextResponse.json(
      { error: "Failed to list videos", message: error.message },
      { status: 500 }
    );
  }
}
