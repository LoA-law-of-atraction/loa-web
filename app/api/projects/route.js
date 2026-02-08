import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

// GET all projects
export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("projects").get();

    const projects = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort by created_at descending (newest first)
    projects.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects", message: error.message },
      { status: 500 }
    );
  }
}
