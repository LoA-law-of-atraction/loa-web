import { NextResponse } from "next/server";
import { getPrompt } from "@/utils/promptService";

export async function GET() {
  try {
    const defaultDescription = getPrompt("music-default-description").trim();
    return NextResponse.json({
      success: true,
      default_description: defaultDescription || "",
    });
  } catch (error) {
    console.error("Music defaults error:", error);
    // Return 200 with empty default so the page still loads
    return NextResponse.json({
      success: true,
      default_description: "",
    });
  }
}
