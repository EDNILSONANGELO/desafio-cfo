import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";

// Paths that never need auth checks
const ALWAYS_PUBLIC = [
  "/api/auth",
  "/api/seed",
  "/api/setup",
  "/_next",
  "/favicon",
];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets and API auth routes — skip everything
  if (ALWAYS_PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Root → /login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const session = await getSessionFromRequest(req);

  // /login: if already logged in → go to dashboard; otherwise let through
  if (pathname.startsWith("/login")) {
    if (session) {
      const dest = session.role === "teacher" ? "/professor" : "/aluno";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // All other routes require a valid session
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Role-based protection
  if (pathname.startsWith("/professor") && session.role !== "teacher") {
    return NextResponse.redirect(new URL("/aluno", req.url));
  }
  if (pathname.startsWith("/aluno") && session.role !== "student") {
    return NextResponse.redirect(new URL("/professor", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
