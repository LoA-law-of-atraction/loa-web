import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

const COLLECTION = "quote_video_history";
const PROJECTS_COLLECTION = "quote_projects";
const LIMIT = 200;
const PROJECTS_READ_LIMIT = 80;

function toEntry(doc, prefix = "gh-") {
  const d = doc.data || doc;
  const url = (d.url || "").trim();
  if (!url) return null;
  const created_at = d.created_at || d.timestamp || null;
  return {
    id: doc.id ? `${prefix}${doc.id}` : `legacy-${url}-${created_at || Date.now()}`,
    project_id: d.project_id ?? null,
    scene_id: d.scene_id ?? null,
    url,
    duration_seconds: d.duration_seconds ?? d.duration ?? 8,
    created_at,
    project_name: (d.project_name || "").trim() || null,
    scene_label: (d.scene_label || "").trim() || null,
  };
}

/**
 * GET /api/quote-videos/video-history
 * Returns all recent generated videos across all projects and scenes for "Select from history".
 * Includes entries from quote_video_history (new) and backfills from existing project/scene history.
 */
export async function GET() {
  try {
    const db = getAdminDb();
    const seen = new Set();
    const byCreated = (a, b) => (new Date(b.created_at || 0)).getTime() - (new Date(a.created_at || 0)).getTime();

    const entries = [];

    try {
      const snapshot = await db
        .collection(COLLECTION)
        .orderBy("created_at", "desc")
        .limit(LIMIT)
        .get();

      snapshot.docs.forEach((doc) => {
        const e = toEntry({ id: doc.id, data: doc.data() || {} }, "gh-");
        if (e && !seen.has(e.url + (e.created_at || ""))) {
          seen.add(e.url + (e.created_at || ""));
          entries.push(e);
        }
      });
    } catch (collErr) {
      console.warn("Quote video-history global collection read:", collErr?.message || collErr);
    }

    try {
      const projectsSnap = await db
        .collection(PROJECTS_COLLECTION)
        .orderBy("updated_at", "desc")
        .limit(PROJECTS_READ_LIMIT)
        .get();

      const projectDocs = projectsSnap.docs;
      const projectDataList = projectDocs.map((doc) => ({ id: doc.id, ...doc.data() }));

      for (const project of projectDataList) {
        const projectId = project.id;
        const projectName = (project.name || "").trim() || null;

        const projectHistory = Array.isArray(project.animation_video_history) ? project.animation_video_history : [];
        for (const h of projectHistory) {
          const url = (h.url || "").trim();
          if (!url) continue;
          const key = url + (h.created_at || "");
          if (seen.has(key)) continue;
          seen.add(key);
          entries.push(toEntry({
            id: `proj-${projectId}-${key}`,
            data: {
              url,
              duration_seconds: h.duration_seconds ?? 8,
              created_at: h.created_at,
              project_id: projectId,
              scene_id: null,
              project_name: projectName,
              scene_label: null,
            },
          }, ""));
        }

        const scenesSnap = await db.collection(PROJECTS_COLLECTION).doc(projectId).collection("scenes").get();
        for (const sceneDoc of scenesSnap.docs) {
          const scene = { id: sceneDoc.id, ...sceneDoc.data() };
          const sceneLabel = (scene.label || "").trim() || null;
          const hist = Array.isArray(scene.video_generation_history) ? scene.video_generation_history : [];
          for (const m of hist) {
            const url = (m.video_url || m.url || "").trim();
            if (!url) continue;
            const created_at = m.timestamp || m.created_at || null;
            const key = url + (created_at || "");
            if (seen.has(key)) continue;
            seen.add(key);
            entries.push(toEntry({
              id: `scene-${projectId}-${scene.id}-${key}`,
              data: {
                url,
                duration_seconds: m.model_request_payload?.duration ?? m.duration_seconds ?? scene.duration ?? 8,
                created_at,
                project_id: projectId,
                scene_id: scene.id,
                project_name: projectName,
                scene_label: sceneLabel,
              },
            }, ""));
          }
        }
      }

      entries.sort(byCreated);
      const limited = entries.slice(0, LIMIT);
      return NextResponse.json({ success: true, entries: limited });
    } catch (backfillErr) {
      console.warn("Quote video-history backfill error:", backfillErr);
      return NextResponse.json({ success: true, entries: entries.slice(0, LIMIT) });
    }
  } catch (error) {
    console.error("Quote video-history get error:", error);
    return NextResponse.json(
      { error: "Failed to load video history", message: error?.message },
      { status: 500 }
    );
  }
}
