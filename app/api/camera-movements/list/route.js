import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("camera_movements").get();

    const camera_movements = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      camera_movements,
    });
  } catch (error) {
    console.error("Error fetching camera movements:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch camera movements",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
