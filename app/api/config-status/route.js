import { NextResponse } from "next/server";

export async function GET() {
  try {
    const status = {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      shotstack: !!process.env.SHOTSTACK_API_KEY,
      fal: !!process.env.FAL_API_KEY,
    };

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
