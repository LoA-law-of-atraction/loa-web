import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

// GET all topic categories
export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("topic_categories").get();

    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort alphabetically by name
    categories.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    return NextResponse.json({
      success: true,
      categories,
      count: categories.length,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories",
        message: error.message,
        categories: [],
      },
      { status: 500 }
    );
  }
}

// POST create new category
export async function POST(request) {
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

    const docRef = db.collection("topic_categories").doc();
    const categoryData = {
      name,
      created_at: new Date().toISOString(),
    };

    await docRef.set(categoryData);

    return NextResponse.json({
      success: true,
      message: "Category created successfully",
      category: {
        id: docRef.id,
        ...categoryData,
      },
    });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "Failed to create category", message: error.message },
      { status: 500 }
    );
  }
}
