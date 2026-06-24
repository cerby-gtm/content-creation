import { NextResponse } from "next/server";
import { addRule } from "@/lib/documents";

export const runtime = "nodejs";

// POST /api/documents/[id]/rules — add a rule bullet to a ruleset document
// (inserts the row, splices the body, versions the change). Body:
// { section?, text, edited_by? }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let payload: { section?: unknown; text?: unknown; edited_by?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (typeof payload?.text !== "string" || !payload.text.trim()) {
    return NextResponse.json({ error: "Missing 'text'." }, { status: 400 });
  }
  const section =
    typeof payload.section === "string" && payload.section.trim() ? payload.section.trim() : null;
  const editedBy =
    typeof payload.edited_by === "string" && payload.edited_by.trim() ? payload.edited_by.trim() : null;

  try {
    await addRule(id, section, payload.text.trim(), editedBy);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("locked") || message.includes("ruleset") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
