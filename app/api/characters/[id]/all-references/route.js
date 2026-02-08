import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing character id" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Get character's main reference images
    const characterDoc = await db.collection("characters").doc(id).get();
    if (!characterDoc.exists) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    const characterData = characterDoc.data();
    const mainReferences = characterData.image_urls || [];

    // Build main references array
    const references = mainReferences.map((url, idx) => ({
      id: `main_${idx}`,
      url: url,
      source: "main",
      label: `Reference ${idx + 1}`,
      project_name: null,
    }));

    // Query projects collection directly by character_id
    const projectsSnapshot = await db
      .collection("projects")
      .where("character.character_id", "==", id)
      .get();

    console.log(`Found ${projectsSnapshot.docs.length} projects for character ${id}`);

    // Get images from each project's scenes subcollection
    for (const projectDoc of projectsSnapshot.docs) {
      const projectData = projectDoc.data();
      const projectId = projectDoc.id;
      const projectName = projectData.project_name || projectData.topic || "Untitled Project";

      // Get all scenes for this project
      const scenesSnapshot = await db
        .collection("projects")
        .doc(projectId)
        .collection("scenes")
        .get();

      // Extract images from each scene
      for (const sceneDoc of scenesSnapshot.docs) {
        const sceneData = sceneDoc.data();
        const sceneImageUrls = sceneData.image_urls || [];

        // Add each image from this scene
        sceneImageUrls.forEach((imageUrl, imgIdx) => {
          references.push({
            id: `${projectId}_scene${sceneData.id}_img${imgIdx}`,
            url: imageUrl,
            source: "project",
            label: `Scene ${sceneData.id || sceneDoc.id}`,
            project_id: projectId,
            project_name: projectName,
            scene_id: sceneData.id || sceneDoc.id,
          });
        });
      }
    }

    console.log(`Loaded ${references.length} total references for character ${id}`);
    console.log(`- ${mainReferences.length} main references`);
    console.log(`- ${references.length - mainReferences.length} from projects`);

    return NextResponse.json({
      success: true,
      references: references,
      total: references.length,
    });
  } catch (error) {
    console.error("Error fetching character references:", error);
    return NextResponse.json(
      { error: "Failed to fetch character references", message: error.message },
      { status: 500 }
    );
  }
}
