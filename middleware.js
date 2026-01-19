import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // Redirect non-www to www (only in production)
  if (host === "loa-lawofattraction.co") {
    const url = request.nextUrl.clone();
    url.host = "www.loa-lawofattraction.co";
    return NextResponse.redirect(url, 301);
  }

  // Only protect /admin routes (except login page)
  if (pathname.startsWith("/admin")) {
    // Allow access to login page
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    // Check for admin authentication cookie
    const authCookie = request.cookies.get("admin_session");

    if (!authCookie) {
      // Redirect to login if not authenticated
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token format (basic validation)
    const token = authCookie.value;
    if (!token || token.length !== 64) {
      // Invalid token, redirect to login
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes that don't need www redirect
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)).*)",
  ],
};
