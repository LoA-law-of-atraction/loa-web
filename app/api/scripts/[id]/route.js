import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

// GET single script with scenes
export async function GET(request, { params }) {
  try {
    const db = getAdminDb();
    const scriptDoc = await db.collection("scripts").doc(params.id).get();

    if (!scriptDoc.exists) {
      return NextResponse.json(
        { error: "Script not found" },
        { status: 404 }
      );
    }

    // Get scenes subcollection
    const scenesSnapshot = await db
      .collection("scripts")
      .doc(params.id)
      .collection("scenes")
      .get();

    const scenes = scenesSnapshot.docs.map((doc) => ({
      ...doc.data(),
    }));

    // Sort scenes by id
    scenes.sort((a, b) => a.id - b.id);

    const scriptData = {
      script: scriptDoc.data().script,
      scenes,
    };

    return NextResponse.json({
      success: true,
      script: {
        id: scriptDoc.id,
        ...scriptDoc.data(),
      },
      scriptData,
    });
  } catch (error) {
    console.error("Get script error:", error);
    return NextResponse.json(
      { error: "Failed to fetch script", message: error.message },
      { status: 500 }
    );
  }
}
