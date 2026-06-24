import { NextResponse } from "next/server";
import { retireRule } from "@/lib/documents";
import { getSessionEmail } from "@/lib/session";

export const runtime = "nodejs";

// POST /api/rules/[id]/retire — retire an active rule and remove its bullet from
// the ruleset document body. The actor is the authenticated session email.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const editedBy = await getSessionEmail();

  try {
    await retireRule(id, editedBy);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("locked") ? 409 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
