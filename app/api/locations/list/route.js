import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function GET(request) {
  try {
    const db = getAdminDb();
    const locationsSnapshot = await db.collection("locations").get();

    if (locationsSnapshot.empty) {
      return NextResponse.json({
        success: true,
        locations: [],
        message: "No locations found. Run /api/locations/seed to populate.",
      });
    }

    const locations = locationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      locations,
      count: locations.length,
    });
  } catch (error) {
    console.error("Error listing locations:", error);
    return NextResponse.json(
      { error: "Failed to list locations", message: error.message },
      { status: 500 }
    );
  }
}
