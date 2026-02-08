import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

// Sample characters data
const sampleCharacters = [
  {
    gender: "female",
    age_range: "30s",
    voice_id: "EXAVITQu4vr4xnSDxMaL", // Sarah - ElevenLabs voice
    name: "Professional Woman",
    description: "Confident professional woman in her 30s"
  },
  {
    gender: "male",
    age_range: "30s",
    voice_id: "VR6AewLTigWG4xSOukaG", // Arnold - ElevenLabs voice
    name: "Professional Man",
    description: "Confident professional man in his 30s"
  },
  {
    gender: "female",
    age_range: "20s",
    voice_id: "21m00Tcm4TlvDq8ikWAM", // Rachel - ElevenLabs voice
    name: "Young Woman",
    description: "Energetic young woman in her 20s"
  },
  {
    gender: "male",
    age_range: "40s",
    voice_id: "yoZ06aMxZJJ28mfd3POQ", // Sam - ElevenLabs voice
    name: "Mature Man",
    description: "Wise mature man in his 40s"
  },
];

export async function POST(request) {
  try {
    const db = getAdminDb();

    // Check if characters already exist
    const existingChars = await db.collection("characters").limit(1).get();

    if (!existingChars.empty) {
      return NextResponse.json({
        success: false,
        message: "Characters already exist. Use force=true to recreate.",
        count: existingChars.size,
      });
    }

    // Create sample characters
    const batch = db.batch();
    const createdCharacters = [];

    for (const char of sampleCharacters) {
      const docRef = db.collection("characters").doc();
      batch.set(docRef, {
        ...char,
        created_at: new Date().toISOString(),
      });
      createdCharacters.push({
        id: docRef.id,
        ...char,
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Created ${createdCharacters.length} characters`,
      characters: createdCharacters,
    });
  } catch (error) {
    console.error("Setup characters error:", error);
    return NextResponse.json(
      {
        error: "Failed to create characters",
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Force recreate characters
export async function DELETE(request) {
  try {
    const db = getAdminDb();

    // Delete all existing characters
    const snapshot = await db.collection("characters").get();
    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Deleted ${snapshot.size} characters`,
    });
  } catch (error) {
    console.error("Delete characters error:", error);
    return NextResponse.json(
      { error: "Failed to delete characters", message: error.message },
      { status: 500 }
    );
  }
}

// Get setup status
export async function GET() {
  try {
    const db = getAdminDb();

    const snapshot = await db.collection("characters").get();

    const characters = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      count: characters.length,
      characters,
      message: characters.length === 0
        ? "No characters found. Run POST /api/setup/characters to create sample characters."
        : `Found ${characters.length} characters`
    });
  } catch (error) {
    console.error("Get setup status error:", error);
    return NextResponse.json(
      {
        error: "Failed to check setup status",
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
