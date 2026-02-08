import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

// GET single category
export async function GET(request, { params }) {
  try {
    const db = getAdminDb();
    const doc = await db.collection("topic_categories").doc(params.id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error("Get category error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category", message: error.message },
      { status: 500 }
    );
  }
}

// PUT update category
export async function PUT(request, { params }) {
  try {
    const db = getAdminDb();
    const body = await request.json();

    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    const docRef = db.collection("topic_categories").doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const updateData = {
      name,
      updated_at: new Date().toISOString(),
    };

    await docRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      category: {
        id: params.id,
        ...updateData,
        created_at: doc.data().created_at,
      },
    });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json(
      { error: "Failed to update category", message: error.message },
      { status: 500 }
    );
  }
}

// DELETE category
export async function DELETE(request, { params }) {
  try {
    const db = getAdminDb();
    const docRef = db.collection("topic_categories").doc(params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { error: "Failed to delete category", message: error.message },
      { status: 500 }
    );
  }
}
