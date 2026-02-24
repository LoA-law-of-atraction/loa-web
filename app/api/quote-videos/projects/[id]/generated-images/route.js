import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

const COLLECTION = "quote_projects";

/**
 * GET /api/quote-videos/projects/[id]/generated-images
 * Returns all generated images for the project from the generated_images subcollection,
 * plus legacy project.background_image_history entries (merged, deduped by url).
 */
export async function GET(_request, { params }) {
  try {
    const { id: projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ error: "Missing project id" }, { status: 400 });
    }

    const db = getAdminDb();
    const projectRef = db.collection(COLLECTION).doc(projectId);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = projectDoc.data() || {};
    const seen = new Set();
    const images = [];

    const snap = await projectRef.collection("generated_images").orderBy("created_at", "desc").limit(100).get();
    snap.docs.forEach((doc) => {
      const d = doc.data();
      const url = (d.url || "").trim();
      if (url && !seen.has(url)) {
        seen.add(url);
        images.push({
          id: doc.id,
          url,
          created_at: d.created_at || null,
          scene_id: d.scene_id ?? null,
          prompt_sent_to_model: d.prompt_sent_to_model ?? null,
          model_endpoint: d.model_endpoint ?? null,
        });
      }
    });

    const legacy = Array.isArray(projectData.background_image_history) ? projectData.background_image_history : [];
    legacy.forEach((entry) => {
      const url = (typeof entry === "string" ? entry : entry?.url || "").trim();
      if (url && !seen.has(url)) {
        seen.add(url);
        images.push({
          id: "legacy-" + url.slice(-20),
          url,
          created_at: typeof entry === "object" && entry?.created_at ? entry.created_at : null,
          scene_id: null,
          prompt_sent_to_model: typeof entry === "object" && entry?.prompt_sent_to_model ? entry.prompt_sent_to_model : null,
          model_endpoint: typeof entry === "object" && entry?.model_endpoint ? entry.model_endpoint : null,
        });
      }
    });

    // Include all scene image_urls (per-scene generations may not be in generated_images if created before that feature)
    const scenesSnap = await projectRef.collection("scenes").get();
    scenesSnap.docs.forEach((sceneDoc) => {
      const sceneId = sceneDoc.id;
      const sceneData = sceneDoc.data() || {};
      const urls = Array.isArray(sceneData.image_urls) ? sceneData.image_urls : [];
      const meta = Array.isArray(sceneData.image_metadata) ? sceneData.image_metadata : [];
      urls.forEach((url, i) => {
        const u = (url || "").trim();
        if (!u || seen.has(u)) return;
        seen.add(u);
        const m = meta[i];
        images.push({
          id: `scene-${sceneId}-${i}-${u.slice(-24)}`,
          url: u,
          created_at: typeof m === "object" && m?.created_at ? m.created_at : null,
          scene_id: sceneId,
          prompt_sent_to_model: typeof m === "object" && m?.prompt_sent_to_model ? m.prompt_sent_to_model : null,
          model_endpoint: typeof m === "object" && m?.model_endpoint ? m.model_endpoint : null,
        });
      });
    });

    images.sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });

    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error("Quote generated-images GET error:", error);
    return NextResponse.json(
      { error: "Failed to load generated images", message: error?.message },
      { status: 500 }
    );
  }
}
