import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function GET(request, { params }) {
  try {
    const { locationId } = await params;

    if (!locationId) {
      return NextResponse.json(
        { error: "Missing locationId" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const locationDoc = await db.collection("locations").doc(locationId).get();

    if (!locationDoc.exists) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      location: {
        id: locationDoc.id,
        ...locationDoc.data(),
      },
    });
  } catch (error) {
    console.error("Error fetching location:", error);
    return NextResponse.json(
      { error: "Failed to fetch location", message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { locationId } = await params;

    if (!locationId) {
      return NextResponse.json(
        { error: "Missing locationId" },
        { status: 400 }
      );
    }

    const updates = await request.json();

    const db = getAdminDb();
    const locationRef = db.collection("locations").doc(locationId);

    // Check if exists
    const locationDoc = await locationRef.get();
    if (!locationDoc.exists) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Update the location
    await locationRef.update({
      ...updates,
      updated_at: new Date().toISOString(),
    });

    console.log(`Updated location ${locationId}:`, updates);

    return NextResponse.json({
      success: true,
      message: "Location updated successfully",
    });
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      { error: "Failed to update location", message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { locationId } = await params;

    if (!locationId) {
      return NextResponse.json(
        { error: "Missing locationId" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const locationRef = db.collection("locations").doc(locationId);

    // Check if exists
    const locationDoc = await locationRef.get();
    if (!locationDoc.exists) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    // Delete the location
    await locationRef.delete();

    console.log(`Deleted location: ${locationId}`);

    return NextResponse.json({
      success: true,
      message: "Location deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      { error: "Failed to delete location", message: error.message },
      { status: 500 }
    );
  }
}
