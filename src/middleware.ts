import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/login", "/portal/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow auth API routes and all API routes
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Always allow public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Demo mode: if no token, allow access but set a demo cookie
  // This lets users explore the UI without a real database
  if (!token) {
    const response = NextResponse.next();
    response.cookies.set("siteforge-demo", "true", { path: "/" });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
