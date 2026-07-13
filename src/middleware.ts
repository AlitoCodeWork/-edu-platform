import { NextRequest, NextResponse } from "next/server";

// Cookie name mirrors SESSION_COOKIE in src/lib/auth/session.ts (kept literal
// so the middleware bundle stays minimal on the edge runtime).
const SESSION_COOKIE = "edu_session";

export function middleware(req: NextRequest) {
  if (!req.cookies.get(SESSION_COOKIE)?.value) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/examen/:path*", "/perfil/:path*"],
};
