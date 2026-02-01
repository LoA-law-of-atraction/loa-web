import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function GET(request, { params }) {
  try {
    const { actionId } = await params;

    if (!actionId) {
      return NextResponse.json(
        { error: "Missing actionId" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const actionDoc = await db.collection("actions").doc(actionId).get();

    if (!actionDoc.exists) {
      return NextResponse.json(
        { error: "Action not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      action: {
        id: actionDoc.id,
        ...actionDoc.data(),
      },
    });
  } catch (error) {
    console.error("Error fetching action:", error);
    return NextResponse.json(
      { error: "Failed to fetch action", message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { actionId } = await params;

    if (!actionId) {
      return NextResponse.json(
        { error: "Missing actionId" },
        { status: 400 }
      );
    }

    const updates = await request.json();

    const db = getAdminDb();
    const actionRef = db.collection("actions").doc(actionId);

    // Check if exists
    const actionDoc = await actionRef.get();
    if (!actionDoc.exists) {
      return NextResponse.json(
        { error: "Action not found" },
        { status: 404 }
      );
    }

    // Update the action
    await actionRef.update({
      ...updates,
      updated_at: new Date().toISOString(),
    });

    console.log(`Updated action ${actionId}:`, updates);

    return NextResponse.json({
      success: true,
      message: "Action updated successfully",
    });
  } catch (error) {
    console.error("Error updating action:", error);
    return NextResponse.json(
      { error: "Failed to update action", message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { actionId } = await params;

    if (!actionId) {
      return NextResponse.json(
        { error: "Missing actionId" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const actionRef = db.collection("actions").doc(actionId);

    // Check if exists
    const actionDoc = await actionRef.get();
    if (!actionDoc.exists) {
      return NextResponse.json(
        { error: "Action not found" },
        { status: 404 }
      );
    }

    // Delete the action
    await actionRef.delete();

    console.log(`Deleted action: ${actionId}`);

    return NextResponse.json({
      success: true,
      message: "Action deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting action:", error);
    return NextResponse.json(
      { error: "Failed to delete action", message: error.message },
      { status: 500 }
    );
  }
}
