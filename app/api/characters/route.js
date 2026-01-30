import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

export async function GET() {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("characters").get();

    const characters = snapshot.docs.map((doc) => ({
      character_id: doc.id,
      ...doc.data(),
    }));

    if (characters.length === 0) {
      return NextResponse.json({
        success: true,
        characters: [],
        message: "No characters found. Visit /api/setup/characters to create sample characters.",
      });
    }

    return NextResponse.json({
      success: true,
      characters,
    });
  } catch (error) {
    console.error("Characters GET error:", error);
    console.error("Error stack:", error.stack);

    return NextResponse.json(
      {
        error: "Failed to fetch characters",
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        hint: "Make sure Firebase Admin SDK is properly configured. Check FIREBASE_SERVICE_ACCOUNT_KEY in .env"
      },
      { status: 500 }
    );
  }
}

// POST create new character
export async function POST(request) {
  try {
    const db = getAdminDb();
    const body = await request.json();

    const { name, gender, age, voice_id, image_urls, prompt } = body;

    // Validate required fields
    if (!name || !gender || !age || !voice_id) {
      return NextResponse.json(
        { error: "Missing required fields: name, gender, age, voice_id" },
        { status: 400 }
      );
    }

    const docRef = db.collection("characters").doc();
    const characterData = {
      name,
      gender,
      age,
      voice_id,
      image_urls: image_urls || [],
      prompt: prompt || "",
      created_at: new Date().toISOString(),
    };

    await docRef.set(characterData);

    return NextResponse.json({
      success: true,
      message: "Character created successfully",
      character: {
        id: docRef.id,
        ...characterData,
      },
    });
  } catch (error) {
    console.error("Create character error:", error);
    return NextResponse.json(
      { error: "Failed to create character", message: error.message },
      { status: 500 }
    );
  }
}
