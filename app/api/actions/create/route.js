import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function POST(request) {
  try {
    const actionData = await request.json();

    // Validate required fields
    if (!actionData.name || !actionData.description) {
      return NextResponse.json(
        { error: "Missing required fields: name and description" },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Generate ID from name
    const id = actionData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    // Check if action with this ID already exists
    const existingAction = await db.collection("actions").doc(id).get();
    if (existingAction.exists) {
      return NextResponse.json(
        { error: "Action with similar name already exists" },
        { status: 409 }
      );
    }

    // Create the action
    const actionRef = db.collection("actions").doc(id);
    const newAction = {
      id,
      name: actionData.name,
      description: actionData.description,
      pose_variations: actionData.pose_variations || [],
      expression: actionData.expression || "",
      tags: actionData.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await actionRef.set(newAction);

    console.log(`Created new action: ${id}`);

    return NextResponse.json({
      success: true,
      action: newAction,
      message: "Action created successfully",
    });
  } catch (error) {
    console.error("Error creating action:", error);
    return NextResponse.json(
      { error: "Failed to create action", message: error.message },
      { status: 500 }
    );
  }
}
