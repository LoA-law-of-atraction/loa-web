import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

const COLLECTION = "quote_projects";

/**
 * POST - Create a new scene (same pattern as Character Shorts: scene doc in project subcollection).
 * Body: { label?, reference_image_url?, image_prompt?, image_urls?, image_prompts?, selected_image_index?, image_metadata? }
 * Returns: { success, scene_id, scene }
 */
export async function POST(request, { params }) {
  try {
    const { id: projectId } = await params;
    const db = getAdminDb();
    const projectRef = db.collection(COLLECTION).doc(projectId);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const sceneId = body.id && typeof body.id === "string" ? body.id : uuidv4();
    const now = new Date().toISOString();

    const scene = {
      id: sceneId,
      label: typeof body.label === "string" ? body.label : `Scene ${sceneId.slice(0, 8)}`,
      reference_image_url: typeof body.reference_image_url === "string" ? body.reference_image_url : "",
      image_prompt: typeof body.image_prompt === "string" ? body.image_prompt : "",
      image_urls: Array.isArray(body.image_urls) ? body.image_urls : [],
      image_prompts: Array.isArray(body.image_prompts) ? body.image_prompts : [],
      selected_image_index: typeof body.selected_image_index === "number" ? body.selected_image_index : 0,
      image_metadata: Array.isArray(body.image_metadata) ? body.image_metadata : [],
      created_at: now,
      updated_at: now,
    };

    const sceneRef = projectRef.collection("scenes").doc(sceneId);
    await sceneRef.set(scene);

    return NextResponse.json({
      success: true,
      scene_id: sceneId,
      scene: { ...scene },
    });
  } catch (error) {
    console.error("Quote create scene error:", error);
    return NextResponse.json(
      { error: "Failed to create scene", message: error.message },
      { status: 500 }
    );
  }
}
