import { NextResponse } from "next/server";
import { getDocument, saveBody } from "@/lib/documents";

export const runtime = "nodejs";

// GET /api/documents/[id] — full document (plus active rule rows for rulesets).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const document = await getDocument(id);
  if (!document) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  return NextResponse.json({ document });
}

// PUT /api/documents/[id] — save a prose document's full body. Body: { body, edited_by? }
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let payload: { body?: unknown; edited_by?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (typeof payload?.body !== "string") {
    return NextResponse.json({ error: "Missing 'body'." }, { status: 400 });
  }
  const editedBy =
    typeof payload.edited_by === "string" && payload.edited_by.trim() ? payload.edited_by.trim() : null;

  try {
    await saveBody(id, payload.body, editedBy);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const lower = message.toLowerCase();
    const status = lower.includes("locked") || lower.includes("ruleset") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
