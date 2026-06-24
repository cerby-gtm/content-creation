import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Protect every route by default. `auth()` attaches the session to `req.auth`;
// any request without one is redirected to /login. The matcher below keeps the
// auth API routes, the login page, and Next.js static assets public.
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
