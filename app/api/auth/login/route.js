import { NextResponse } from "next/server";
import crypto from "crypto";

// Allowed admin emails for Google Sign In
const ALLOWED_ADMINS = [process.env.ADMIN_EMAIL].filter(Boolean);

// Generate session token without external dependencies
function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { password, googleToken, email } = body;

    let isValid = false;

    // Handle Google Sign In
    if (googleToken && email) {
      // Verify the email is in the allowed admins list
      if (ALLOWED_ADMINS.includes(email)) {
        isValid = true;
      } else {
        return NextResponse.json(
          { error: "This email is not authorized for admin access" },
          { status: 401 },
        );
      }
    }
    // Handle password login
    else if (password) {
      // Dynamically import bcrypt only when needed for password auth
      try {
        const { verifyAdminCredentials } = await import("@/utils/authService");
        isValid = await verifyAdminCredentials(password);
      } catch (e) {
        console.error("Password auth not available:", e);
        return NextResponse.json(
          { error: "Password authentication is not configured" },
          { status: 500 },
        );
      }
    } else {
      return NextResponse.json(
        { error: "Password or Google authentication is required" },
        { status: 400 },
      );
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Generate session token
    const token = generateSessionToken();

    // Create response with session cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        session: { isAdmin: true },
      },
      { status: 200 },
    );

    // Set HTTP-only cookie
    response.cookies.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
