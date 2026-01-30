import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

// GET single topic
export async function GET(request, { params }) {
  try {
    const db = getAdminDb();
    const doc = await db.collection("topics").doc(params.id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      topic: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error("Get topic error:", error);
    return NextResponse.json(
      { error: "Failed to fetch topic", message: error.message },
      { status: 500 }
    );
  }
}

// PUT update topic
export async function PUT(request, { params }) {
  try {
    const db = getAdminDb();
    const body = await request.json();

    const { topic, categories, generated } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "Missing required field: topic" },
        { status: 400 }
      );
    }

    const docRef = db.collection("topics").doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    // Prepare categories array
    let categoriesArray = categories && Array.isArray(categories) ? categories : [];

    const updateData = {
      topic,
      categories: categoriesArray,
      generated: generated !== undefined ? generated : doc.data().generated,
      updated_at: new Date().toISOString(),
    };

    await docRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: "Topic updated successfully",
      topic: {
        id: params.id,
        ...updateData,
        created_at: doc.data().created_at,
      },
    });
  } catch (error) {
    console.error("Update topic error:", error);
    return NextResponse.json(
      { error: "Failed to update topic", message: error.message },
      { status: 500 }
    );
  }
}

// DELETE topic
export async function DELETE(request, { params }) {
  try {
    const db = getAdminDb();
    const docRef = db.collection("topics").doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: "Topic deleted successfully",
    });
  } catch (error) {
    console.error("Delete topic error:", error);
    return NextResponse.json(
      { error: "Failed to delete topic", message: error.message },
      { status: 500 }
    );
  }
}
