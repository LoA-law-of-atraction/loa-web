import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

// GET all scripts
export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("scripts").get();

    const scripts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by created_at descending (newest first)
    scripts.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      scripts,
    });
  } catch (error) {
    console.error("Get scripts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scripts", message: error.message },
      { status: 500 }
    );
  }
}
