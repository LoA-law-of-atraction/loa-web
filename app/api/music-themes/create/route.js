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
    const existing = await db.collection("music_themes").doc(id).get();
    if (existing.exists) {
      return NextResponse.json(
        { error: "Music theme with similar name already exists" },
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

    await db.collection("music_themes").doc(id).set(newDoc);

    return NextResponse.json({
      success: true,
      music_theme: newDoc,
      message: "Music theme created successfully",
    });
  } catch (error) {
    console.error("Error creating music theme:", error);
    return NextResponse.json(
      { error: "Failed to create music theme", message: error.message },
      { status: 500 },
    );
  }
}
