import { auth } from "@/auth";
import { isAdmin } from "./admin";

// Server-side identity helpers. Every write in the app should attribute the
// actor from the authenticated session — never from a client-supplied field —
// so the analytics dashboard reports trustworthy "who did what". Use these in
// route handlers and server components only (they call auth(), which is not
// available in the edge middleware bundle).

export async function getSessionEmail(): Promise<string | null> {
  const session = await auth();
  return session?.user?.email ?? null;
}

/** True only for an authenticated admin (see src/lib/admin.ts). */
export async function isAdminSession(): Promise<boolean> {
  return isAdmin(await getSessionEmail());
}
