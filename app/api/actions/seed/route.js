import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";
import { ACTIONS_LIBRARY } from "@/data/actions-library";

export async function POST() {
  try {
    const db = getAdminDb();
    const batch = db.batch();

    // Get existing actions
    const existingActionsSnapshot = await db.collection("actions").get();
    const existingActionIds = new Set(existingActionsSnapshot.docs.map(doc => doc.id));

    // Identify new actions to add
    const newActions = ACTIONS_LIBRARY.filter(action => !existingActionIds.has(action.id));

    if (newActions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All actions already seeded, no new actions to add",
        count: existingActionsSnapshot.size,
      });
    }

    // Seed only new actions
    for (const action of newActions) {
      const actionRef = db.collection("actions").doc(action.id);
      batch.set(actionRef, {
        ...action,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    await batch.commit();

    console.log(`Successfully seeded ${newActions.length} new actions`);

    return NextResponse.json({
      success: true,
      message: `Seeded ${newActions.length} new actions`,
      count: existingActionsSnapshot.size + newActions.length,
      new_actions: newActions.map(a => a.name),
    });
  } catch (error) {
    console.error("Error seeding actions:", error);
    return NextResponse.json(
      { error: "Failed to seed actions", message: error.message },
      { status: 500 }
    );
  }
}
