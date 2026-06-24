import { NextResponse } from "next/server";
import { retireRule } from "@/lib/documents";

export const runtime = "nodejs";

// POST /api/rules/[id]/retire — retire an active rule and remove its bullet from
// the ruleset document body. Body: { edited_by? }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let editedBy: string | null = null;
  try {
    const payload = await request.json();
    if (typeof payload?.edited_by === "string" && payload.edited_by.trim()) {
      editedBy = payload.edited_by.trim();
    }
  } catch {
    // No body is fine.
  }

  try {
    await retireRule(id, editedBy);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("locked") ? 409 : message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
