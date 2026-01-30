import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

// POST - Create new project
export async function POST(request) {
  try {
    const { project_name, status = "draft" } = await request.json();

    if (!project_name) {
      return NextResponse.json(
        { error: "Missing project_name" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const projectRef = db.collection("projects").doc();

    // Create new project document
    await projectRef.set({
      project_name,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      project_id: projectRef.id,
    });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Failed to create project", message: error.message },
      { status: 500 }
    );
  }
}
