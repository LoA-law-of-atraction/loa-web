import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("character_motions").get();

    const character_motions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      character_motions,
    });
  } catch (error) {
    console.error("Error fetching character motions:", error);
    return NextResponse.json(
      { error: "Failed to fetch character motions", message: error.message },
      { status: 500 },
    );
  }
}
