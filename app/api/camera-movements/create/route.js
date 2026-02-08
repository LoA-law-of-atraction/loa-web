import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.name || !body.description) {
      return NextResponse.json(
        { error: "Missing required fields: name and description" },
        { status: 400 },
      );
    }

    const id = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    const db = getAdminDb();
    const existing = await db.collection("camera_movements").doc(id).get();
    if (existing.exists) {
      return NextResponse.json(
        { error: "Camera movement with similar name already exists" },
        { status: 409 },
      );
    }

    const newDoc = {
      id,
      name: body.name,
      description: body.description,
      tags: body.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.collection("camera_movements").doc(id).set(newDoc);

    return NextResponse.json({
      success: true,
      camera_movement: newDoc,
      message: "Camera movement created successfully",
    });
  } catch (error) {
    console.error("Error creating camera movement:", error);
    return NextResponse.json(
      { error: "Failed to create camera movement", message: error.message },
      { status: 500 },
    );
  }
}
