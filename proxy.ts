import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public paths
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/seed") ||
    pathname.startsWith("/api/setup") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(req);

  // Not logged in → redirect to login
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based protection
  if (pathname.startsWith("/professor") && session.role !== "teacher") {
    return NextResponse.redirect(new URL("/aluno", req.url));
  }

  if (pathname.startsWith("/aluno") && session.role !== "student") {
    return NextResponse.redirect(new URL("/professor", req.url));
  }

  // Logged in user hitting /login → redirect to dashboard
  if (pathname === "/login") {
    if (session.role === "teacher") return NextResponse.redirect(new URL("/professor", req.url));
    return NextResponse.redirect(new URL("/aluno", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
