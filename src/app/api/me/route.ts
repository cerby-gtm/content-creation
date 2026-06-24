import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { getSessionEmail } from "@/lib/session";

export const runtime = "nodejs";

// GET /api/me — the signed-in user's email and whether they're an admin. Used by
// the client UI to decide whether to show the admin-only Analytics link.
export async function GET() {
  const email = await getSessionEmail();
  return NextResponse.json({ email, isAdmin: isAdmin(email) });
}
