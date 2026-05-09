import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files, API uploads, and Next.js assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/uploads") ||
    pathname.startsWith("/favicon") ||
    /\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|ttf|eot)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("never2_token")?.value;

  // For API routes without token, return 401 instead of redirecting
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "请先登录" },
        { status: 401 }
      );
    }

    // For page routes, redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
