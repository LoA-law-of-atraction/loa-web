import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function GET() {
  try {
    const db = getAdminDb();
    const actionsSnapshot = await db.collection("actions").get();

    const actions = actionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      actions,
    });
  } catch (error) {
    console.error("Error fetching actions:", error);
    return NextResponse.json(
      { error: "Failed to fetch actions", message: error.message },
      { status: 500 }
    );
  }
}
