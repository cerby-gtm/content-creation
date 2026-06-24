import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// The middleware runs on the edge runtime, so it builds its own NextAuth
// instance from the edge-safe authConfig (no `pg`, no login-logging events —
// those live in src/auth.ts, which the API routes use). Protect every route by
// default: any request without a session is redirected to /login. The matcher
// below keeps the auth API routes, the login page, and Next.js static assets public.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Run on all paths except:
    //  - /api/auth/*        (NextAuth's own endpoints)
    //  - /login             (the sign-in page)
    //  - /_next/*           (Next.js internals)
    //  - static asset files (favicon, images, etc.)
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};
