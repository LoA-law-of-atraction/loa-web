import { NextResponse } from "next/server";
import { getAdminDb, getAdminStorage } from "@/utils/firebaseAdmin";

const COLLECTION = "quote_projects";

/** Derive Firebase Storage path from a firebasestorage.googleapis.com or storage.googleapis.com URL */
function getStoragePathFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  const u = new URL(url);
  if (u.hostname === "firebasestorage.googleapis.com" && u.pathname.includes("/o/")) {
    const m = u.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)/);
    if (m) return decodeURIComponent(m[1]);
  }
  const bucket = getAdminStorage().bucket();
  const storageOrigin = `https://storage.googleapis.com/${bucket.name}/`;
  if (url.startsWith(storageOrigin)) return decodeURIComponent(url.slice(storageOrigin.length).split("?")[0]);
  return null;
}

/**
 * POST /api/quote-videos/delete-background-image
 * Body: { project_id: string, url: string }
 * Removes the image from background_image_history and deletes the file from Storage.
 * If it was the selected background_image_url, sets it to another from history or null.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const projectId = body.project_id || "";
    const urlToRemove = typeof body.url === "string" ? body.url.trim() : "";
    const sceneId = typeof body.scene_id === "string" ? body.scene_id.trim() : null;

    if (!projectId || !urlToRemove) {
      return NextResponse.json(
        { success: false, error: "Missing project_id or url" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const ref = db.collection(COLLECTION).doc(projectId);
    const doc = await ref.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const data = doc.data();

    if (sceneId) {
      const sceneRef = ref.collection("scenes").doc(sceneId);
      const sceneDoc = await sceneRef.get();
      if (sceneDoc.exists) {
        const scene = sceneDoc.data() || {};
        const urls = Array.isArray(scene.image_urls) ? scene.image_urls : [];
        const idx = urls.indexOf(urlToRemove);
        if (idx < 0) {
          return NextResponse.json(
            { success: false, error: "Image not found in list" },
            { status: 404 }
          );
        }
        const storagePath = getStoragePathFromUrl(urlToRemove);
        if (storagePath) {
          try {
            const bucket = getAdminStorage().bucket();
            await bucket.file(storagePath).delete();
          } catch (err) {
            console.error("Storage delete error (continuing):", err.message);
          }
        }
        const prompts = Array.isArray(scene.image_prompts) ? scene.image_prompts : [];
        const meta = Array.isArray(scene.image_metadata) ? scene.image_metadata : [];
        const newUrls = urls.filter((_, i) => i !== idx);
        const newPrompts = prompts.filter((_, i) => i !== idx);
        const newMeta = meta.filter((_, i) => i !== idx);
        let newSelectedIndex = scene.selected_image_index ?? 0;
        if (newSelectedIndex >= newUrls.length) newSelectedIndex = Math.max(0, newUrls.length - 1);
        if (idx < newSelectedIndex) newSelectedIndex = Math.max(0, newSelectedIndex - 1);
        else if (idx === newSelectedIndex) newSelectedIndex = Math.min(newSelectedIndex, newUrls.length - 1);
        await sceneRef.update({
          image_urls: newUrls,
          image_prompts: newPrompts,
          selected_image_index: newSelectedIndex,
          image_metadata: newMeta,
          updated_at: new Date().toISOString(),
        });
        const histSnap = await ref.collection("generated_images").where("url", "==", urlToRemove).get();
        histSnap.docs.forEach((d) => d.ref.delete().catch((e) => console.error("generated_images delete:", e.message)));
        const newSelectedUrl = newUrls[newSelectedIndex] || null;
        return NextResponse.json({
          success: true,
          background_image_url: newSelectedUrl,
        });
      }
    }

    const history = Array.isArray(data.background_image_history) ? data.background_image_history : [];
    const newHistory = history.filter((entry) => {
      const url = typeof entry === "string" ? entry : entry?.url;
      return url !== urlToRemove;
    });

    if (newHistory.length === history.length) {
      return NextResponse.json(
        { success: false, error: "Image not found in list" },
        { status: 404 }
      );
    }

    const storagePath = getStoragePathFromUrl(urlToRemove);
    if (storagePath) {
      try {
        const bucket = getAdminStorage().bucket();
        await bucket.file(storagePath).delete();
      } catch (err) {
        console.error("Storage delete error (continuing):", err.message);
      }
    }

    const currentSelected = data.background_image_url || "";
    const newSelected =
      currentSelected === urlToRemove
        ? newHistory.length > 0
          ? (typeof newHistory[newHistory.length - 1] === "string"
              ? newHistory[newHistory.length - 1]
              : newHistory[newHistory.length - 1]?.url)
          : ""
        : currentSelected;

    await ref.update({
      updated_at: new Date().toISOString(),
      background_image_url: newSelected || null,
      background_image_history: newHistory,
    });

    const histSnap = await ref.collection("generated_images").where("url", "==", urlToRemove).get();
    histSnap.docs.forEach((d) => d.ref.delete().catch((e) => console.error("generated_images delete:", e.message)));

    return NextResponse.json({
      success: true,
      background_image_url: newSelected || null,
    });
  } catch (error) {
    console.error("Delete background image error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete image" },
      { status: 500 }
    );
  }
}
