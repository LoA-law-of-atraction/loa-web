import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

// GET single character
export async function GET(request, { params }) {
  try {
    const db = getAdminDb();
    const doc = await db.collection("characters").doc(params.id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      character: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error("Get character error:", error);
    return NextResponse.json(
      { error: "Failed to fetch character", message: error.message },
      { status: 500 }
    );
  }
}

// PUT update character
export async function PUT(request, { params }) {
  try {
    const db = getAdminDb();
    const body = await request.json();

    const { name, gender, age, voice_id, image_urls, prompt } = body;

    // Validate required fields
    if (!name || !gender || !age || !voice_id) {
      return NextResponse.json(
        { error: "Missing required fields: name, gender, age, voice_id" },
        { status: 400 }
      );
    }

    const docRef = db.collection("characters").doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    const updateData = {
      name,
      gender,
      age,
      voice_id,
      image_urls: image_urls || [],
      prompt: prompt || "",
      updated_at: new Date().toISOString(),
    };

    await docRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: "Character updated successfully",
      character: {
        id: params.id,
        ...updateData,
        created_at: doc.data().created_at,
      },
    });
  } catch (error) {
    console.error("Update character error:", error);
    return NextResponse.json(
      { error: "Failed to update character", message: error.message },
      { status: 500 }
    );
  }
}

// DELETE character
export async function DELETE(request, { params }) {
  try {
    const db = getAdminDb();
    const docRef = db.collection("characters").doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: "Character deleted successfully",
    });
  } catch (error) {
    console.error("Delete character error:", error);
    return NextResponse.json(
      { error: "Failed to delete character", message: error.message },
      { status: 500 }
    );
  }
}
