import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("hospital_crm_token")?.value;

  const isAuthPage = pathname.startsWith("/login");

  // If user is not logged in and trying to access any protected page, redirect to /login
  if (!token && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If user is already logged in and tries to access /login, redirect to dashboard /
  if (token && isAuthPage) {
    const dashboardUrl = new URL("/", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon, and images in public
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icon|.*\\..*).*)",
  ],
};
