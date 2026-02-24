import { NextResponse } from "next/server";
import { getAdminDb } from "@/utils/firebaseAdmin";

const THEMES_COLLECTION = "quote_themes";

// Common motivational themes for suggestions (plus ones from projects + quote_themes)
const DEFAULT_THEMES = [
  "success",
  "mindset",
  "courage",
  "resilience",
  "growth",
  "discipline",
  "focus",
  "confidence",
  "perseverance",
  "motivation",
  "leadership",
  "change",
  "failure",
  "fear",
  "gratitude",
  "happiness",
  "purpose",
  "goals",
  "ambition",
  "productivity",
  "overcoming adversity",
  "self-belief",
  "taking action",
  "patience",
  "consistency",
  "dreams",
  "hard work",
  "new beginnings",
  "letting go",
  "inner strength",
];

function themeToId(theme) {
  return theme
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** GET - Theme suggestions: from quote_themes + quote_projects + default list, optional ?q= filter */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    const db = getAdminDb();

    const [projectsSnap, themesSnap] = await Promise.all([
      db
        .collection("quote_projects")
        .orderBy("updated_at", "desc")
        .limit(200)
        .get(),
      db.collection(THEMES_COLLECTION).get(),
    ]);

    const fromProjects = new Set();
    projectsSnap.docs.forEach((doc) => {
      const t = doc.data().theme;
      if (t && typeof t === "string" && t.trim()) fromProjects.add(t.trim());
    });

    const fromCollection = new Set();
    themesSnap.docs.forEach((doc) => {
      const t = doc.data().theme;
      if (t && typeof t === "string" && t.trim()) fromCollection.add(t.trim());
    });

    const combined = [...new Set([...DEFAULT_THEMES, ...fromCollection, ...fromProjects])].filter(
      Boolean
    );
    const suggestions = q
      ? combined.filter((t) => t.toLowerCase().includes(q)).slice(0, 15)
      : combined.slice(0, 20);

    return NextResponse.json({ success: true, suggestions });
  } catch (error) {
    console.error("Theme suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to load suggestions", message: error.message },
      { status: 500 }
    );
  }
}

/** POST - Add a theme to the suggestions collection if it's new (e.g. when user clicks Next) */
export async function POST(request) {
  try {
    const body = await request.json();
    const theme = typeof body.theme === "string" ? body.theme.trim() : "";
    if (!theme) {
      return NextResponse.json({ success: true, added: false });
    }

    const db = getAdminDb();
    const id = themeToId(theme);
    if (!id) return NextResponse.json({ success: true, added: false });

    const ref = db.collection(THEMES_COLLECTION).doc(id);
    const doc = await ref.get();
    if (doc.exists) {
      return NextResponse.json({ success: true, added: false });
    }

    await ref.set({
      theme,
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, added: true });
  } catch (error) {
    console.error("Theme add error:", error);
    return NextResponse.json(
      { error: "Failed to add theme", message: error.message },
      { status: 500 }
    );
  }
}
