import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

// GET all topics
export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("topics").get();

    const topics = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by created_at on client side to avoid index issues
    topics.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      topics,
      count: topics.length,
    });
  } catch (error) {
    console.error("Get topics error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch topics",
        message: error.message,
        topics: [],
      },
      { status: 500 }
    );
  }
}

// POST create new topic
export async function POST(request) {
  try {
    const db = getAdminDb();
    const body = await request.json();

    const { topic, category, categories, generated } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "Missing required field: topic" },
        { status: 400 }
      );
    }

    const docRef = db.collection("topics").doc();

    // Handle categories array
    let categoriesArray = categories && Array.isArray(categories) ? categories : [];

    const topicData = {
      topic,
      categories: categoriesArray,
      generated: generated || false,
      created_at: new Date().toISOString(),
    };

    await docRef.set(topicData);

    return NextResponse.json({
      success: true,
      message: "Topic created successfully",
      topic: {
        id: docRef.id,
        ...topicData,
      },
    });
  } catch (error) {
    console.error("Create topic error:", error);
    return NextResponse.json(
      { error: "Failed to create topic", message: error.message },
      { status: 500 }
    );
  }
}
